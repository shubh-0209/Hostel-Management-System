import { supabase } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';

export const getBeds = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { data, error } = await supabase
      .from('beds')
      .select('id, bed_number, status')
      .eq('room_id', roomId)
      .order('bed_number');

    if (error) throw new ApiError(500, error.message);
    
    return sendSuccess(res, 200, 'Beds retrieved', data);
  } catch (error) {
    next(error);
  }
};

export const createBed = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { bed_number, status } = req.body;

    const { data, error } = await supabase
      .from('beds')
      .insert({ room_id: roomId, bed_number, status })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new ApiError(409, 'Bed number already exists in this room');
      if (error.code === '23503') throw new ApiError(404, 'Room not found');
      throw new ApiError(500, error.message);
    }

    return sendSuccess(res, 201, 'Bed created successfully', data);
  } catch (error) {
    next(error);
  }
};

export const updateBed = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Check if bed is currently allocated. If so, changing status to maintenance/available is forbidden.
    const { data: bed, error: bedError } = await supabase
      .from('beds')
      .select('status')
      .eq('id', id)
      .single();

    if (bedError) throw new ApiError(500, bedError.message);
    
    if (bed.status === 'allocated' && status !== 'allocated') {
      throw new ApiError(409, 'Cannot modify status of an actively allocated bed');
    }

    const { error } = await supabase
      .from('beds')
      .update({ status })
      .eq('id', id);

    if (error) throw new ApiError(500, error.message);

    return sendSuccess(res, 200, 'Bed updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteBed = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if bed is currently allocated
    const { data: bed, error: bedError } = await supabase
      .from('beds')
      .select('status')
      .eq('id', id)
      .single();

    if (bedError) throw new ApiError(500, bedError.message);
    if (bed.status === 'allocated') {
      throw new ApiError(409, 'Cannot delete an actively allocated bed');
    }

    const { error } = await supabase
      .from('beds')
      .delete()
      .eq('id', id);

    if (error) throw new ApiError(500, error.message);

    return sendSuccess(res, 200, 'Bed deleted successfully');
  } catch (error) {
    next(error);
  }
};
