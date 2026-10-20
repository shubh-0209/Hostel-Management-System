import { supabase } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';

// Phase 2 - Warden Dashboard Stats
export const getDashboardStats = async (req, res, next) => {
  try {
    // 1. Total Students
    const { count: studentCount } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    // 2. Hostels & Beds (we'll fetch hostels with beds)
    const { data: hostelsData } = await supabase
      .from('hostels')
      .select(`
        id,
        rooms:floors(rooms(count)),
        beds:floors(rooms(beds(count)))
      `);

    let totalHostels = 0;
    let totalRooms = 0;
    let totalBeds = 0;

    if (hostelsData) {
      totalHostels = hostelsData.length;
      hostelsData.forEach(h => {
        totalRooms += h.rooms?.reduce((acc, f) => acc + (f.rooms?.[0]?.count || 0), 0) || 0;
        totalBeds += h.beds?.reduce((acc, f) => acc + f.rooms?.reduce((rAcc, r) => rAcc + (r.beds?.[0]?.count || 0), 0), 0) || 0;
      });
    }

    // 3. Occupied Beds
    const { count: occupiedBeds } = await supabase
      .from('bed_allocations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // 4. Pending Outings
    const { count: pendingOutings } = await supabase
      .from('outing_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // 5. Pending Maintenance
    const { count: pendingMaintenance } = await supabase
      .from('maintenance_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    return sendSuccess(res, 200, 'Dashboard stats retrieved', {
      total_students: studentCount || 0,
      total_hostels: totalHostels,
      total_rooms: totalRooms,
      total_beds: totalBeds,
      occupied_beds: occupiedBeds || 0,
      available_beds: totalBeds - (occupiedBeds || 0),
      occupancy_rate: totalBeds ? Math.round(((occupiedBeds || 0) / totalBeds) * 100) : 0,
      pending_outings: pendingOutings || 0,
      pending_maintenance: pendingMaintenance || 0
    });
  } catch (error) {
    next(error);
  }
};

// Phase 3 - Outing Management
export const getOutings = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = supabase
      .from('outing_requests')
      .select(`
        *,
        students(name, jntu_number, current_year, phone)
      `)
      .order('created_at', { ascending: false });
      
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw new ApiError(500, error.message);

    return sendSuccess(res, 200, 'Outings retrieved', data);
  } catch (error) {
    next(error);
  }
};

export const updateOutingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejection_reason } = req.body;
    const wardenId = req.user.id;

    if (!['approved', 'rejected'].includes(status)) {
      throw new ApiError(400, 'Invalid status update');
    }

    if (status === 'rejected' && !rejection_reason) {
      throw new ApiError(400, 'Rejection reason is required');
    }

    const updateData = {
      status,
      warden_id: wardenId,
      reviewed_at: new Date().toISOString()
    };
    if (status === 'rejected') updateData.rejection_reason = rejection_reason;

    const { data, error } = await supabase
      .from('outing_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);

    // Insert notification
    await supabase.from('notifications').insert({
      user_id: data.student_id,
      title: `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: status === 'approved' 
        ? 'Your application has been approved.'
        : `Your application was rejected: ${rejection_reason}`,
      is_read: false
    });

    return sendSuccess(res, 200, 'Application status updated', data);
  } catch (error) {
    next(error);
  }
};

export const checkoutRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const wardenId = req.user.id;

    const { data: request, error: fetchError } = await supabase
      .from('outing_requests')
      .select('status, application_type')
      .eq('id', id)
      .single();

    if (fetchError || !request) throw new ApiError(404, 'Request not found');
    if (request.application_type === 'leave') {
      throw new ApiError(400, 'Leaves do not require physical check-out; they are marked returned upon completion');
    }
    if (request.status !== 'approved') {
      throw new ApiError(400, 'Only approved Out Passes can be checked out');
    }

    const { data, error } = await supabase
      .from('outing_requests')
      .update({
        status: 'checked_out',
        actual_out_datetime: new Date().toISOString(),
        checked_out_by: wardenId
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);

    return sendSuccess(res, 200, 'Student marked as checked out', data);
  } catch (error) {
    next(error);
  }
};

export const returnRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const wardenId = req.user.id;

    const { data: request, error: fetchError } = await supabase
      .from('outing_requests')
      .select('status, application_type')
      .eq('id', id)
      .single();

    if (fetchError || !request) throw new ApiError(404, 'Request not found');
    
    if (request.application_type === 'out_pass' && request.status !== 'checked_out') {
      throw new ApiError(400, 'Only checked-out Out Passes can be returned');
    }
    if (request.application_type === 'leave' && request.status !== 'approved') {
      throw new ApiError(400, 'Only approved Leaves can be returned');
    }

    const { data, error } = await supabase
      .from('outing_requests')
      .update({
        status: 'returned',
        actual_in_datetime: new Date().toISOString(),
        returned_by: wardenId
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);

    return sendSuccess(res, 200, 'Student marked as returned', data);
  } catch (error) {
    next(error);
  }
};

// Phase 4 - Maintenance Management
export const getMaintenanceRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = supabase
      .from('maintenance_requests')
      .select(`
        *,
        hostels(name),
        rooms(room_number)
      `)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw new ApiError(500, error.message);

    return sendSuccess(res, 200, 'Maintenance requests retrieved', data);
  } catch (error) {
    next(error);
  }
};

export const updateMaintenanceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['in_progress', 'resolved', 'cancelled'].includes(status)) {
      throw new ApiError(400, 'Invalid status');
    }

    const updateData = { status };
    if (status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('maintenance_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new ApiError(500, error.message);

    return sendSuccess(res, 200, 'Maintenance request updated', data);
  } catch (error) {
    next(error);
  }
};

// Seeding/creation helper for UI
export const createMaintenanceRequest = async (req, res, next) => {
  try {
    const { hostel_id, room_id, issue_type, description, priority } = req.body;
    const { data, error } = await supabase
      .from('maintenance_requests')
      .insert({ hostel_id, room_id, issue_type, description, priority, reported_by: req.user.id })
      .select()
      .single();
    if (error) throw new ApiError(500, error.message);
    return sendSuccess(res, 201, 'Maintenance request created', data);
  } catch (error) {
    next(error);
  }
};

// Phase 5 - Occupancy Reports
export const getOccupancyReport = async (req, res, next) => {
  try {
    // We fetch all hostels with their active allocations to calculate occupancy
    const { data, error } = await supabase
      .from('hostels')
      .select(`
        id, name,
        beds:floors(rooms(beds(id))),
        allocations:floors(rooms(beds(bed_allocations(id))))
      `);

    if (error) throw new ApiError(500, error.message);

    // Transform into standard report
    const report = data.map(hostel => {
      let totalBeds = 0;
      let totalAllocations = 0;

      // Count beds
      hostel.beds?.forEach(floor => {
        floor.rooms?.forEach(room => {
          totalBeds += room.beds?.length || 0;
        });
      });

      // Count ACTIVE allocations
      // bed_allocations inside beds query only returns if it matched the join. Wait, we need to filter active allocations.
      // To properly get active allocations, it's safer to query bed_allocations joined with hostel.
      // Let's do a simpler query: get all beds, get all active allocations.
      return {
        id: hostel.id,
        name: hostel.name,
        total_beds: totalBeds
      };
    });

    // We can run a secondary query for active allocations grouped by hostel
    const { data: allocationsData, error: allocError } = await supabase
      .from('bed_allocations')
      .select(`
        id,
        status,
        beds!inner(rooms!inner(floors!inner(hostel_id)))
      `)
      .eq('status', 'active');
      
    if (allocError) throw new ApiError(500, allocError.message);

    // Map allocations to hostels
    const hostelOccupancy = {};
    allocationsData.forEach(alloc => {
      const hId = alloc.beds.rooms.floors.hostel_id;
      hostelOccupancy[hId] = (hostelOccupancy[hId] || 0) + 1;
    });

    const finalReport = report.map(h => {
      const occupied_beds = hostelOccupancy[h.id] || 0;
      const available_beds = h.total_beds - occupied_beds;
      const occupancy_percentage = h.total_beds > 0 ? Math.round((occupied_beds / h.total_beds) * 100) : 0;
      return {
        ...h,
        occupied_beds,
        available_beds,
        occupancy_percentage
      };
    });

    return sendSuccess(res, 200, 'Occupancy report generated', finalReport);
  } catch (error) {
    next(error);
  }
};
