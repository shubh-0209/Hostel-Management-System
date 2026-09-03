import { supabase } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';

export const getFloors = async (req, res, next) => {
  try {
    const { hostelId } = req.params;
    const { data, error } = await supabase
      .from('floors')
      .select('id, floor_number')
      .eq('hostel_id', hostelId)
      .order('floor_number');

    if (error) throw new ApiError(500, error.message);
    
    return sendSuccess(res, 200, 'Floors retrieved', data);
  } catch (error) {
    next(error);
  }
};

export const createFloor = async (req, res, next) => {
  try {
    const { hostelId } = req.params;
    const { floor_number } = req.body;

    const { data, error } = await supabase
      .from('floors')
      .insert({ hostel_id: hostelId, floor_number })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new ApiError(409, 'Floor number already exists in this hostel');
      if (error.code === '23503') throw new ApiError(404, 'Hostel not found');
      throw new ApiError(500, error.message);
    }

    return sendSuccess(res, 201, 'Floor created successfully', data);
  } catch (error) {
    next(error);
  }
};

export const updateFloor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { floor_number } = req.body;

    const { error } = await supabase
      .from('floors')
      .update({ floor_number })
      .eq('id', id);

    if (error) {
      if (error.code === '23505') throw new ApiError(409, 'Floor number already exists in this hostel');
      throw new ApiError(500, error.message);
    }

    return sendSuccess(res, 200, 'Floor updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteFloor = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check for active allocations
    const { count, error: countError } = await supabase
      .from('bed_allocations')
      .select('id, beds!inner(rooms!inner(floor_id))', { count: 'exact' })
      .eq('status', 'active')
      .eq('beds.rooms.floor_id', id);

    if (countError) throw new ApiError(500, countError.message);
    if (count > 0) throw new ApiError(409, 'Cannot delete floor with active bed allocations');

    const { error } = await supabase
      .from('floors')
      .delete()
      .eq('id', id);

    if (error) throw new ApiError(500, error.message);

    return sendSuccess(res, 200, 'Floor deleted successfully');
  } catch (error) {
    next(error);
  }
};
