import { supabase } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';

export const getHostels = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('hostels')
      .select(`
        id, name, code, status,
        hostel_years(academic_year),
        floors(count),
        rooms:floors(rooms(count)),
        beds:floors(rooms(beds(count)))
      `)
      .order('name');

    if (error) throw new ApiError(500, error.message);
    
    // Format the response slightly to make frontend consumption easier
    const formatted = data.map(h => ({
      ...h,
      academic_years: h.hostel_years.map(y => y.academic_year).sort(),
      // Supabase count returns an array of [{count: X}] for nested counts
      floor_count: h.floors?.[0]?.count || 0,
      room_count: h.rooms?.reduce((acc, f) => acc + (f.rooms?.[0]?.count || 0), 0) || 0,
      bed_count: h.beds?.reduce((acc, f) => acc + f.rooms?.reduce((rAcc, r) => rAcc + (r.beds?.[0]?.count || 0), 0), 0) || 0,
      hostel_years: undefined, floors: undefined, rooms: undefined, beds: undefined
    }));

    return sendSuccess(res, 200, 'Hostels retrieved', formatted);
  } catch (error) {
    next(error);
  }
};

export const getHostel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('hostels')
      .select(`
        id, name, code, status,
        hostel_years(academic_year)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw new ApiError(404, 'Hostel not found');
      throw new ApiError(500, error.message);
    }

    const formatted = {
      ...data,
      academic_years: data.hostel_years.map(y => y.academic_year).sort(),
      hostel_years: undefined
    };

    return sendSuccess(res, 200, 'Hostel retrieved', formatted);
  } catch (error) {
    next(error);
  }
};

export const createHostel = async (req, res, next) => {
  try {
    const { name, code, status, academic_years } = req.body;

    // 1. Create Hostel
    const { data: hostel, error: hostelError } = await supabase
      .from('hostels')
      .insert({ name, code, status })
      .select()
      .single();

    if (hostelError) {
      if (hostelError.code === '23505') throw new ApiError(409, 'Hostel code already exists');
      throw new ApiError(500, hostelError.message);
    }

    // 2. Create Academic Year Mappings
    if (academic_years && academic_years.length > 0) {
      const yearMappings = academic_years.map(year => ({
        hostel_id: hostel.id,
        academic_year: year
      }));
      
      const { error: yearError } = await supabase
        .from('hostel_years')
        .insert(yearMappings);
        
      if (yearError) throw new ApiError(500, yearError.message);
    }

    return sendSuccess(res, 201, 'Hostel created successfully', { ...hostel, academic_years });
  } catch (error) {
    next(error);
  }
};

export const updateHostel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, code, status, academic_years } = req.body;

    // 1. Update Hostel
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (code !== undefined) updates.code = code;
    if (status !== undefined) updates.status = status;

    if (Object.keys(updates).length > 0) {
      const { error: hostelError } = await supabase
        .from('hostels')
        .update(updates)
        .eq('id', id);

      if (hostelError) {
        if (hostelError.code === '23505') throw new ApiError(409, 'Hostel code already exists');
        throw new ApiError(500, hostelError.message);
      }
    }

    // 2. Update Academic Years if provided
    if (academic_years) {
      // Simplest approach: Delete all existing and re-insert
      await supabase.from('hostel_years').delete().eq('hostel_id', id);
      
      if (academic_years.length > 0) {
        const yearMappings = academic_years.map(year => ({
          hostel_id: id,
          academic_year: year
        }));
        const { error: yearError } = await supabase.from('hostel_years').insert(yearMappings);
        if (yearError) throw new ApiError(500, yearError.message);
      }
    }

    return sendSuccess(res, 200, 'Hostel updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteHostel = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Deleting a hostel cascades to floors, rooms, beds, and bed_allocations.
    // If we wanted to prevent deleting a hostel with active allocations, we would check that first.
    // The instructions say "Delete hostel where safe". Let's check for active allocations.
    const { data: allocations, error: allocError } = await supabase
      .from('bed_allocations')
      .select('id')
      .eq('status', 'active')
      .eq('beds.rooms.floors.hostel_id', id); // Supabase allows querying related if structured properly, but let's do a simpler check.

    // A simpler robust check using RPC or multiple queries:
    const { count, error: countError } = await supabase
      .from('bed_allocations')
      .select('id, beds!inner(rooms!inner(floors!inner(hostel_id)))', { count: 'exact' })
      .eq('status', 'active')
      .eq('beds.rooms.floors.hostel_id', id);

    if (countError) throw new ApiError(500, countError.message);
    if (count > 0) throw new ApiError(409, 'Cannot delete hostel with active bed allocations');

    const { error } = await supabase
      .from('hostels')
      .delete()
      .eq('id', id);

    if (error) throw new ApiError(500, error.message);

    return sendSuccess(res, 200, 'Hostel deleted successfully');
  } catch (error) {
    next(error);
  }
};
