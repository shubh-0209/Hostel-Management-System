import { supabase } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';

export const getRooms = async (req, res, next) => {
  try {
    const { floorId } = req.params;
    const { data, error } = await supabase
      .from('rooms')
      .select('id, room_number, type, is_ac, capacity, status')
      .eq('floor_id', floorId)
      .order('room_number');

    if (error) throw new ApiError(500, error.message);
    
    return sendSuccess(res, 200, 'Rooms retrieved', data);
  } catch (error) {
    next(error);
  }
};

export const createRoom = async (req, res, next) => {
  try {
    const { floorId } = req.params;
    const { room_number, type, is_ac, capacity, status } = req.body;

    const { data, error } = await supabase
      .from('rooms')
      .insert({ floor_id: floorId, room_number, type, is_ac, capacity, status })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') throw new ApiError(409, 'Room number already exists on this floor');
      if (error.code === '23503') throw new ApiError(404, 'Floor not found');
      throw new ApiError(500, error.message);
    }

    return sendSuccess(res, 201, 'Room created successfully', data);
  } catch (error) {
    next(error);
  }
};

export const updateRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { error } = await supabase
      .from('rooms')
      .update(updates)
      .eq('id', id);

    if (error) {
      if (error.code === '23505') throw new ApiError(409, 'Room number already exists on this floor');
      throw new ApiError(500, error.message);
    }

    return sendSuccess(res, 200, 'Room updated successfully');
  } catch (error) {
    next(error);
  }
};

export const deleteRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const { count, error: countError } = await supabase
      .from('bed_allocations')
      .select('id, beds!inner(room_id)', { count: 'exact' })
      .eq('status', 'active')
      .eq('beds.room_id', id);

    if (countError) throw new ApiError(500, countError.message);
    if (count > 0) throw new ApiError(409, 'Cannot delete room with active bed allocations');

    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id);

    if (error) throw new ApiError(500, error.message);

    return sendSuccess(res, 200, 'Room deleted successfully');
  } catch (error) {
    next(error);
  }
};
