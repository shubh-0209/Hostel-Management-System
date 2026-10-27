import { supabase } from '../config/supabase.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';

const MEAL_ORDER = {
  breakfast: 1,
  lunch: 2,
  snacks: 3,
  dinner: 4,
};

export const getMessMenu = async (req, res, next) => {
  try {
    const { hostel_id, day_of_week } = req.query || {};
    let targetHostel = null;

    if (hostel_id) {
      // Specific hostel requested
      const { data: hostel, error: hErr } = await supabase
        .from('hostels')
        .select('id, name, code, status')
        .eq('id', hostel_id)
        .maybeSingle();

      if (hErr) throw new ApiError(500, hErr.message);
      if (!hostel) throw new ApiError(404, 'Hostel not found');
      targetHostel = hostel;
    } else {
      // Auto-detect based on role
      if (req.user?.role === 'student') {
        const { data: alloc, error: aErr } = await supabase
          .from('bed_allocations')
          .select(`
            id, status,
            bed:beds (
              id,
              room:rooms (
                id,
                floor:floors (
                  id,
                  hostel:hostels ( id, name, code, status )
                )
              )
            )
          `)
          .eq('student_id', req.user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (aErr) throw new ApiError(500, aErr.message);

        if (alloc?.bed?.room?.floor?.hostel) {
          targetHostel = alloc.bed.room.floor.hostel;
        }
      }

      // If still not determined (unallocated student or warden with no param)
      if (!targetHostel) {
        const { data: defaultHostel, error: dErr } = await supabase
          .from('hostels')
          .select('id, name, code, status')
          .order('name')
          .limit(1)
          .maybeSingle();

        if (dErr) throw new ApiError(500, dErr.message);
        if (!defaultHostel) {
          return sendSuccess(res, 200, 'No hostels available', { hostel: null, menu: [] });
        }
        targetHostel = defaultHostel;
      }
    }

    // Fetch menu entries for target hostel
    let query = supabase
      .from('mess_menus')
      .select('*')
      .eq('hostel_id', targetHostel.id)
      .order('day_of_week', { ascending: true });

    if (day_of_week !== undefined && day_of_week !== null) {
      query = query.eq('day_of_week', Number(day_of_week));
    }

    const { data: menuEntries, error: mErr } = await query;
    if (mErr) throw new ApiError(500, mErr.message);

    // Sort menu entries by day and then natural meal time order
    const sortedMenu = (menuEntries || []).sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) {
        return a.day_of_week - b.day_of_week;
      }
      return (MEAL_ORDER[a.meal_type] || 99) - (MEAL_ORDER[b.meal_type] || 99);
    });

    return sendSuccess(res, 200, 'Mess menu retrieved successfully', {
      hostel: targetHostel,
      menu: sortedMenu,
    });
  } catch (error) {
    next(error);
  }
};

export const getMessMenuById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('mess_menus')
      .select('*, hostel:hostels(id, name, code)')
      .eq('id', id)
      .maybeSingle();

    if (error) throw new ApiError(500, error.message);
    if (!data) throw new ApiError(404, 'Mess menu entry not found');

    return sendSuccess(res, 200, 'Mess menu entry retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const createMessMenu = async (req, res, next) => {
  try {
    const { hostel_id, day_of_week, meal_type, menu_items } = req.body;

    // Verify hostel exists
    const { data: hostel, error: hErr } = await supabase
      .from('hostels')
      .select('id')
      .eq('id', hostel_id)
      .maybeSingle();

    if (hErr) throw new ApiError(500, hErr.message);
    if (!hostel) throw new ApiError(404, 'Hostel not found');

    const cleanMealType = meal_type.toLowerCase().trim();
    const cleanMenuItems = menu_items.trim();

    const { data, error } = await supabase
      .from('mess_menus')
      .insert({
        hostel_id,
        day_of_week: Number(day_of_week),
        meal_type: cleanMealType,
        menu_items: cleanMenuItems,
      })
      .select('*, hostel:hostels(id, name, code)')
      .single();

    if (error) {
      if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique_hostel_day_meal')) {
        throw new ApiError(409, `A menu entry already exists for this hostel on day ${day_of_week} for ${cleanMealType}`);
      }
      throw new ApiError(500, error.message);
    }

    return sendSuccess(res, 201, 'Mess menu entry created successfully', data);
  } catch (error) {
    next(error);
  }
};

export const updateMessMenu = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { hostel_id, day_of_week, meal_type, menu_items } = req.body;

    // Verify existing entry exists
    const { data: existing, error: eErr } = await supabase
      .from('mess_menus')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (eErr) throw new ApiError(500, eErr.message);
    if (!existing) throw new ApiError(404, 'Mess menu entry not found');

    // If changing hostel_id, verify destination hostel exists
    if (hostel_id && hostel_id !== existing.hostel_id) {
      const { data: hostel, error: hErr } = await supabase
        .from('hostels')
        .select('id')
        .eq('id', hostel_id)
        .maybeSingle();

      if (hErr) throw new ApiError(500, hErr.message);
      if (!hostel) throw new ApiError(404, 'Hostel not found');
    }

    const updatePayload = {};
    if (hostel_id !== undefined) updatePayload.hostel_id = hostel_id;
    if (day_of_week !== undefined) updatePayload.day_of_week = Number(day_of_week);
    if (meal_type !== undefined) updatePayload.meal_type = meal_type.toLowerCase().trim();
    if (menu_items !== undefined) updatePayload.menu_items = menu_items.trim();

    const { data, error } = await supabase
      .from('mess_menus')
      .update(updatePayload)
      .eq('id', id)
      .select('*, hostel:hostels(id, name, code)')
      .single();

    if (error) {
      if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique_hostel_day_meal')) {
        throw new ApiError(409, `A menu entry already exists for this hostel on day ${updatePayload.day_of_week || existing.day_of_week} for ${updatePayload.meal_type || existing.meal_type}`);
      }
      throw new ApiError(500, error.message);
    }

    return sendSuccess(res, 200, 'Mess menu entry updated successfully', data);
  } catch (error) {
    next(error);
  }
};

export const deleteMessMenu = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: existing, error: eErr } = await supabase
      .from('mess_menus')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (eErr) throw new ApiError(500, eErr.message);
    if (!existing) throw new ApiError(404, 'Mess menu entry not found');

    const { error } = await supabase
      .from('mess_menus')
      .delete()
      .eq('id', id);

    if (error) throw new ApiError(500, error.message);

    return sendSuccess(res, 200, 'Mess menu entry deleted successfully', { id });
  } catch (error) {
    next(error);
  }
};
