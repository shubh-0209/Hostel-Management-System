-- Migration: 20240928000000_student_portal_enhancements.sql
-- 1. Add department to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS department VARCHAR(100) DEFAULT 'Computer Science & Engineering';
UPDATE students SET department = 'Computer Science & Engineering' WHERE department IS NULL;

-- 2. Atomic Bed Vacate RPC
CREATE OR REPLACE FUNCTION vacate_bed(p_student_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_allocation_id UUID;
    v_bed_id UUID;
BEGIN
    -- 1. Find and lock active allocation for this student
    SELECT id, bed_id INTO v_allocation_id, v_bed_id
    FROM bed_allocations
    WHERE student_id = p_student_id AND status = 'active'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No active bed allocation found for this student';
    END IF;

    -- 2. Lock the associated bed row
    PERFORM 1 FROM beds WHERE id = v_bed_id FOR UPDATE;

    -- 3. Mark allocation as completed and record released_at
    UPDATE bed_allocations
    SET status = 'completed', released_at = CURRENT_TIMESTAMP
    WHERE id = v_allocation_id;

    -- 4. Mark bed as available
    UPDATE beds
    SET status = 'available'
    WHERE id = v_bed_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Bed vacated successfully',
        'allocation_id', v_allocation_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

REVOKE EXECUTE ON FUNCTION vacate_bed(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION vacate_bed(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION vacate_bed(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION vacate_bed(UUID) TO service_role;

-- 3. Enhance allocate_bed RPC with Academic Year Eligibility Check
CREATE OR REPLACE FUNCTION public.allocate_bed(p_student_id uuid, p_bed_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    v_bed_status bed_status;
    v_active_allocations INT;
    v_allocation_id UUID;
    v_eligible INT;
BEGIN
    -- 1. Lock bed row for update to prevent concurrent access
    SELECT status INTO v_bed_status 
    FROM beds 
    WHERE id = p_bed_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bed not found';
    END IF;

    -- 2. Check bed availability
    IF v_bed_status != 'available' THEN
        RAISE EXCEPTION 'Bed is not available (Status: %)', v_bed_status;
    END IF;

    -- 3. Check if student already has an active allocation
    SELECT count(*) INTO v_active_allocations 
    FROM bed_allocations 
    WHERE student_id = p_student_id AND status = 'active';

    IF v_active_allocations > 0 THEN
        RAISE EXCEPTION 'Student already has an active bed allocation';
    END IF;

    -- 4. Check academic year eligibility
    SELECT count(*) INTO v_eligible
    FROM beds b
    JOIN rooms r ON b.room_id = r.id
    JOIN floors f ON r.floor_id = f.id
    JOIN hostel_years hy ON f.hostel_id = hy.hostel_id
    JOIN students s ON s.id = p_student_id
    WHERE b.id = p_bed_id AND hy.academic_year = s.current_year;

    IF v_eligible = 0 THEN
        RAISE EXCEPTION 'Hostel is not eligible for student''s academic year';
    END IF;

    -- 5. Update bed status to 'allocated'
    UPDATE beds 
    SET status = 'allocated' 
    WHERE id = p_bed_id;

    -- 6. Insert new active allocation
    INSERT INTO bed_allocations (student_id, bed_id, status)
    VALUES (p_student_id, p_bed_id, 'active')
    RETURNING id INTO v_allocation_id;

    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Bed allocated successfully', 
        'allocation_id', v_allocation_id
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false, 
        'error', SQLERRM
    );
END;
$function$;

REVOKE EXECUTE ON FUNCTION allocate_bed(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION allocate_bed(UUID, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION allocate_bed(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION allocate_bed(UUID, UUID) TO service_role;
