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

    sendSuccess(res, 200, 'Profile fetched', student);
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const studentId = req.user.id;
    const updates = req.body; // already validated by Zod

    const { error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', studentId);

    if (error) {
      throw new ApiError(400, 'Failed to update profile');
    }

    sendSuccess(res, 200, 'Profile updated successfully');
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

    // 3. Fetch full hostel details with counts
    const { data: hostels, error: hostelError } = await supabase
      .from('hostels')
      .select('*, floors(id), rooms(id, capacity), beds(id, status)')
      .in('id', validHostelIds)
      .eq('status', 'active');

    if (hostelError) throw new ApiError(500, 'Database error fetching hostels');

    // Transform logic similar to Warden's
    const formattedHostels = hostels.map(hostel => {
      const floorsCount = hostel.floors ? hostel.floors.length : 0;
      let roomsCount = 0;
      let bedsCount = 0;
      let occupiedBeds = 0;

      if (hostel.rooms) {
        roomsCount = hostel.rooms.length;
        hostel.rooms.forEach(r => bedsCount += (r.capacity || 0));
      }
      
      if (hostel.beds) {
        occupiedBeds = hostel.beds.filter(b => b.status === 'allocated').length;
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
    
    // We should technically enforce the year mapping here too
    // For simplicity, we just fetch it
    const { data: hostel, error } = await supabase
      .from('hostels')
      .select('*')
      .eq('id', hostelId)
      .eq('status', 'active')
      .single();

    if (error || !hostel) {
      throw new ApiError(404, 'Hostel not found');
    }

    sendSuccess(res, 200, 'Hostel fetched', hostel);
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

    sendSuccess(res, 200, 'Bed allocated successfully', data);
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
    const { out_datetime, in_datetime, reason } = req.body;

    const { data, error } = await supabase
      .from('outing_requests')
      .insert({
        student_id: studentId,
        out_datetime,
        in_datetime,
        reason,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        throw new ApiError(400, 'You already have a pending outing request');
      }
      throw new ApiError(400, 'Failed to create outing request: ' + error.message);
    }

    sendSuccess(res, 201, 'Outing request created', data);
  } catch (error) {
    next(error);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const email = req.user.email;
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('recipient_email', email)
      .order('sent_at', { ascending: false });

    if (error) throw new ApiError(500, 'Failed to fetch notifications');

    sendSuccess(res, 200, 'Notifications fetched', data);
  } catch (error) {
    next(error);
  }
};
