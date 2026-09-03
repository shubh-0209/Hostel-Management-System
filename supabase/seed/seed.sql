-- Seed script for Warden/Admin and some initial infrastructure

DO $$
DECLARE
    v_warden_id UUID := 'ffef0d42-c572-4c6e-a8df-c94e726775fc'; -- Real Auth UUID from User
    v_hostel_id UUID;
    v_floor_id UUID;
    v_room_id UUID;
BEGIN
    -- 1. Insert Warden Profile
    INSERT INTO profiles (id, role) VALUES (v_warden_id, 'warden') ON CONFLICT DO NOTHING;
    INSERT INTO wardens (id, name, employee_id, phone) 
    VALUES (v_warden_id, 'Admin Warden', 'EMP-001', '1234567890') ON CONFLICT DO NOTHING;

    -- 2. Insert Hostel A (For 1st and 2nd Year)
    INSERT INTO hostels (name, code) VALUES ('Hostel Alpha', 'HST-A') RETURNING id INTO v_hostel_id;
    INSERT INTO hostel_years (hostel_id, academic_year) VALUES (v_hostel_id, 1), (v_hostel_id, 2);

    -- 3. Insert Floor 1
    INSERT INTO floors (hostel_id, floor_number) VALUES (v_hostel_id, 1) RETURNING id INTO v_floor_id;

    -- 4. Insert Room 101 (2 Beds, AC)
    INSERT INTO rooms (floor_id, room_number, type, is_ac, capacity) 
    VALUES (v_floor_id, '101', 'Double', true, 2) RETURNING id INTO v_room_id;

    -- 5. Insert 2 Beds for Room 101
    INSERT INTO beds (room_id, bed_number, status) VALUES (v_room_id, 1, 'available'), (v_room_id, 2, 'maintenance');

    -- 6. Insert Hostel B (For 3rd and 4th Year)
    INSERT INTO hostels (name, code) VALUES ('Hostel Beta', 'HST-B') RETURNING id INTO v_hostel_id;
    INSERT INTO hostel_years (hostel_id, academic_year) VALUES (v_hostel_id, 3), (v_hostel_id, 4);
    
    -- 7. Insert Floor 1 for Hostel B
    INSERT INTO floors (hostel_id, floor_number) VALUES (v_hostel_id, 1) RETURNING id INTO v_floor_id;

    -- 8. Insert Room 101 for Hostel B (1 Bed, Non-AC)
    INSERT INTO rooms (floor_id, room_number, type, is_ac, capacity) 
    VALUES (v_floor_id, '101', 'Single', false, 1) RETURNING id INTO v_room_id;

    -- 9. Insert 1 Bed for Room 101 Hostel B
    INSERT INTO beds (room_id, bed_number) VALUES (v_room_id, 1);

    -- 10. Insert Test Student
    DECLARE
        v_student_id UUID := 'a285a66a-1863-4dbf-9c84-4f6c6f00e37e';
    BEGIN
        INSERT INTO profiles (id, role) VALUES (v_student_id, 'student') ON CONFLICT DO NOTHING;
        INSERT INTO students (id, name, jntu_number, current_year, phone, parent_email) 
        VALUES (v_student_id, 'Test Student', '21B71A0501', 1, '9876543210', 'parent@example.com') 
        ON CONFLICT DO NOTHING;
    END;

END $$;
