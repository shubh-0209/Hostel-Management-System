import { supabase } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';

export const getProfile = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { data: student, error } = await supabase
      .from('students')
      .select('*, profiles(role)')
      .eq('id', studentId)
      .single();

    if (error || !student) {
      throw new ApiError(404, 'Student profile not found');
    }

    // Fetch active allocation if any
    const { data: alloc } = await supabase
      .from('bed_allocations')
      .select(`
        id, status, allocated_at,
        bed:beds (
          id, bed_number,
          room:rooms (
            id, room_number, type,
            floor:floors (
              id, floor_number,
              hostel:hostels ( id, name, code )
            )
          )
        )
      `)
      .eq('student_id', studentId)
      .eq('status', 'active')
      .maybeSingle();

    const formattedAllocation = alloc?.bed ? {
      id: alloc.id,
      hostel_name: alloc.bed.room?.floor?.hostel?.name || 'N/A',
      hostel_code: alloc.bed.room?.floor?.hostel?.code || '',
      floor_number: alloc.bed.room?.floor?.floor_number,
      room_number: alloc.bed.room?.room_number || 'N/A',
      room_type: alloc.bed.room?.type || 'Standard',
      bed_number: alloc.bed.bed_number,
      allocated_at: alloc.allocated_at
    } : null;

    const profileData = {
      ...student,
      email: req.user.email || '',
      allocation: formattedAllocation
    };

    sendSuccess(res, 200, 'Profile fetched', profileData);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { phone, parent_email } = req.body; // validated by Zod

    const updates = {};
    if (phone !== undefined) updates.phone = phone;
    if (parent_email !== undefined) updates.parent_email = parent_email;

    if (Object.keys(updates).length === 0) {
      throw new ApiError(400, 'No valid fields to update');
    }

    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', studentId)
      .select()
      .single();

    if (error) {
      throw new ApiError(400, 'Failed to update profile: ' + error.message);
    }

    sendSuccess(res, 200, 'Profile updated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getHostels = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // 1. Get student's current academic year
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('current_year')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      throw new ApiError(404, 'Student record not found');
    }

    const currentYear = student.current_year;

    // 2. Fetch active hostels eligible for this year via hostel_years
    const { data: validYears, error: yearError } = await supabase
      .from('hostel_years')
      .select('hostel_id')
      .eq('academic_year', currentYear);

    if (yearError) {
      throw new ApiError(500, 'Failed to fetch eligible hostels');
    }

    const validHostelIds = validYears.map(y => y.hostel_id);

    if (validHostelIds.length === 0) {
      return sendSuccess(res, 200, 'Hostels fetched', []);
    }

    // 3. Fetch full hostel details with nested floors, rooms, and beds
    const { data: hostels, error: hostelError } = await supabase
      .from('hostels')
      .select('*, floors(id, floor_number, rooms(id, room_number, capacity, beds(id, status)))')
      .in('id', validHostelIds)
      .eq('status', 'active');

    if (hostelError) throw new ApiError(500, 'Database error fetching hostels: ' + hostelError.message);

    const formattedHostels = hostels.map(hostel => {
      const floorsCount = hostel.floors ? hostel.floors.length : 0;
      let roomsCount = 0;
      let bedsCount = 0;
      let occupiedBeds = 0;

      if (hostel.floors) {
        hostel.floors.forEach(floor => {
          if (floor.rooms) {
            roomsCount += floor.rooms.length;
            floor.rooms.forEach(room => {
              if (room.beds) {
                bedsCount += room.beds.length;
                occupiedBeds += room.beds.filter(b => b.status === 'allocated').length;
              }
            });
          }
        });
      }

      return {
        id: hostel.id,
        name: hostel.name,
        code: hostel.code,
        status: hostel.status,
        academic_years: [currentYear],
        floor_count: floorsCount,
        room_count: roomsCount,
        bed_count: bedsCount,
        occupied_beds: occupiedBeds
      };
    });

    sendSuccess(res, 200, 'Hostels fetched', formattedHostels);
  } catch (error) {
    next(error);
  }
};

export const getHostel = async (req, res, next) => {
  try {
    const { hostelId } = req.params;
    const studentId = req.user.id;

    // 1. Get student current year
    const { data: student } = await supabase
      .from('students')
      .select('current_year')
      .eq('id', studentId)
      .single();

    if (!student) throw new ApiError(404, 'Student record not found');

    // 2. Verify hostel eligibility for this student's year
    const { data: yearMapping } = await supabase
      .from('hostel_years')
      .select('academic_year')
      .eq('hostel_id', hostelId)
      .eq('academic_year', student.current_year)
      .maybeSingle();

    if (!yearMapping) {
      throw new ApiError(403, 'This hostel is not eligible for your academic year');
    }

    const { data: hostel, error } = await supabase
      .from('hostels')
      .select('*')
      .eq('id', hostelId)
      .eq('status', 'active')
      .single();

    if (error || !hostel) {
      throw new ApiError(404, 'Hostel not found');
    }

    sendSuccess(res, 200, 'Hostel fetched', {
      ...hostel,
      academic_years: [student.current_year]
    });
  } catch (error) {
    next(error);
  }
};

export const getAllocation = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // We only care about active allocations
    const { data, error } = await supabase
      .from('bed_allocations')
      .select(`
        id, status, allocated_at,
        bed:beds (
          id, bed_number,
          room:rooms (
            id, room_number, type, capacity,
            floor:floors (
              id, floor_number,
              hostel:hostels (
                id, name, code
              )
            )
          )
        )
      `)
      .eq('student_id', studentId)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found, gracefully return null
        return sendSuccess(res, 200, 'No active allocation', null);
      }
      throw new ApiError(500, 'Error fetching allocation');
    }

    // Transform to flatten the structure slightly for the UI
    const formatted = {
      id: data.id,
      status: data.status,
      created_at: data.allocated_at,
      allocated_at: data.allocated_at,
      bed: { id: data.bed.id, bed_number: data.bed.bed_number },
      room: { id: data.bed.room.id, room_number: data.bed.room.room_number, type: data.bed.room.type, capacity: data.bed.room.capacity },
      floor: { id: data.bed.room.floor.id, floor_number: data.bed.room.floor.floor_number },
      hostel: { id: data.bed.room.floor.hostel.id, name: data.bed.room.floor.hostel.name, code: data.bed.room.floor.hostel.code }
    };

    sendSuccess(res, 200, 'Active allocation fetched', formatted);
  } catch (error) {
    next(error);
  }
};

export const allocateBed = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { bed_id } = req.body;

    // Call the RPC function
    const { data, error } = await supabase.rpc('allocate_bed', {
      p_student_id: studentId,
      p_bed_id: bed_id
    });

    if (error) {
      throw new ApiError(400, 'Allocation failed: ' + error.message);
    }

    // The RPC returns a JSONB object directly
    if (data && data.success === false) {
      throw new ApiError(400, data.error || 'Allocation failed');
    }

    // Insert notification for the student
    await supabase.from('notifications').insert({
      user_id: studentId,
      title: 'Bed Allocated Successfully',
      message: 'Your bed allocation has been confirmed. Check the dashboard for details.',
      is_read: false
    });

    sendSuccess(res, 200, 'Bed allocated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const vacateBed = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // Call the atomic vacate_bed RPC function
    const { data, error } = await supabase.rpc('vacate_bed', {
      p_student_id: studentId
    });

    if (error) {
      throw new ApiError(400, 'Vacate failed: ' + error.message);
    }

    if (data && data.success === false) {
      throw new ApiError(400, data.error || 'Failed to vacate bed');
    }

    // Insert notification for the student
    await supabase.from('notifications').insert({
      user_id: studentId,
      title: 'Bed Vacated',
      message: 'Your bed allocation has been successfully released. The bed is now available.',
      is_read: false
    });

    sendSuccess(res, 200, 'Bed vacated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const getOutings = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { data, error } = await supabase
      .from('outing_requests')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw new ApiError(500, 'Failed to fetch outings');

    sendSuccess(res, 200, 'Outings fetched', data);
  } catch (error) {
    next(error);
  }
};

export const createOuting = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    
    // req.body is already validated by Zod and contains exactly what is needed
    // for either out_pass or leave.
    const payload = {
      student_id: studentId,
      status: 'pending',
      ...req.body
    };

    const { data, error } = await supabase
      .from('outing_requests')
      .insert(payload)
      .select()
      .single();

    if (error) {
      if (error.code === '23P04' || error.message.includes('prevent_overlapping_active_applications')) {
        throw new ApiError(400, 'You already have an active application that overlaps with this time period');
      }
      if (error.code === '23505') {
        throw new ApiError(400, 'Duplicate application detected');
      }
      throw new ApiError(400, 'Failed to create application: ' + error.message);
    }

    sendSuccess(res, 201, 'Application created successfully', data);
  } catch (error) {
    next(error);
  }
};

export const cancelOuting = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { id } = req.params;

    // Check current status
    const { data: request, error: fetchError } = await supabase
      .from('outing_requests')
      .select('status')
      .eq('id', id)
      .eq('student_id', studentId)
      .single();

    if (fetchError || !request) {
      throw new ApiError(404, 'Application not found');
    }

    if (request.status !== 'pending') {
      throw new ApiError(400, 'Only pending applications can be cancelled');
    }

    const { error } = await supabase
      .from('outing_requests')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('student_id', studentId);

    if (error) throw new ApiError(500, 'Failed to cancel application');

    sendSuccess(res, 200, 'Application cancelled successfully');
  } catch (error) {
    next(error);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    // With new schema, we can query by user_id
    const studentId = req.user.id;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false });

    if (error) throw new ApiError(500, 'Failed to fetch notifications');

    sendSuccess(res, 200, 'Notifications fetched', data);
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', studentId);

    if (error) throw new ApiError(500, 'Failed to mark notification as read');

    sendSuccess(res, 200, 'Notification marked as read');
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', studentId)
      .eq('is_read', false);

    if (error) throw new ApiError(500, 'Failed to mark notifications as read');

    sendSuccess(res, 200, 'All notifications marked as read');
  } catch (error) {
    next(error);
  }
};

export const getMaintenanceRequests = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { data, error } = await supabase
      .from('maintenance_requests')
      .select(`
        id, issue_type, description, priority, status, created_at, resolved_at,
        hostel:hostels(id, name, code),
        room:rooms(id, room_number)
      `)
      .eq('reported_by', studentId)
      .order('created_at', { ascending: false });

    if (error) throw new ApiError(500, 'Failed to fetch maintenance requests: ' + error.message);

    sendSuccess(res, 200, 'Maintenance requests fetched', data);
  } catch (error) {
    next(error);
  }
};

export const createMaintenanceRequest = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { issue_type, description, priority = 'medium' } = req.body;

    // Check student's active allocation to link their hostel and room
    const { data: alloc, error: allocError } = await supabase
      .from('bed_allocations')
      .select(`
        bed:beds (
          room:rooms (
            id,
            floor:floors ( hostel_id )
          )
        )
      `)
      .eq('student_id', studentId)
      .eq('status', 'active')
      .maybeSingle();

    if (!alloc?.bed?.room) {
      throw new ApiError(400, 'You must have an active bed allocation to submit a hostel maintenance complaint.');
    }

    const hostelId = alloc.bed.room.floor.hostel_id;
    const roomId = alloc.bed.room.id;

    const { data, error } = await supabase
      .from('maintenance_requests')
      .insert({
        hostel_id: hostelId,
        room_id: roomId,
        issue_type,
        description,
        priority,
        status: 'pending',
        reported_by: studentId
      })
      .select(`
        *,
        hostel:hostels(id, name, code),
        room:rooms(id, room_number)
      `)
      .single();

    if (error) throw new ApiError(500, 'Failed to submit complaint: ' + error.message);

    // Send student confirmation notification
    await supabase.from('notifications').insert({
      user_id: studentId,
      title: 'Complaint Registered',
      message: `Your maintenance request for "${issue_type}" has been registered.`,
      is_read: false
    });

    sendSuccess(res, 201, 'Maintenance complaint submitted successfully', data);
  } catch (error) {
    next(error);
  }
};

export const cancelMaintenanceRequest = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const { id } = req.params;

    const { data: request, error: fetchError } = await supabase
      .from('maintenance_requests')
      .select('status')
      .eq('id', id)
      .eq('reported_by', studentId)
      .single();

    if (fetchError || !request) {
      throw new ApiError(404, 'Complaint not found');
    }

    if (request.status !== 'pending') {
      throw new ApiError(400, 'Only pending complaints can be cancelled');
    }

    const { error } = await supabase
      .from('maintenance_requests')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('reported_by', studentId);

    if (error) throw new ApiError(500, 'Failed to cancel complaint: ' + error.message);

    sendSuccess(res, 200, 'Complaint cancelled successfully');
  } catch (error) {
    next(error);
  }
};
