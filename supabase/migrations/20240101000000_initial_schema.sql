-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Custom Types
CREATE TYPE user_role AS ENUM ('student', 'warden');
CREATE TYPE hostel_status AS ENUM ('active', 'maintenance');
CREATE TYPE room_status AS ENUM ('active', 'maintenance');
CREATE TYPE bed_status AS ENUM ('available', 'allocated', 'maintenance');
CREATE TYPE allocation_status AS ENUM ('active', 'completed', 'cancelled');
CREATE TYPE outing_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed');

-- 2. Profiles Table (Linked to auth.users theoretically)
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    role user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Students Table
CREATE TABLE students (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    jntu_number VARCHAR(50) NOT NULL UNIQUE,
    current_year INT NOT NULL CHECK (current_year IN (1, 2, 3, 4)),
    phone VARCHAR(20) NOT NULL,
    parent_email VARCHAR(255) NOT NULL
);

-- 4. Wardens Table
CREATE TABLE wardens (
    id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL
);

-- 5. Hostels Table
CREATE TABLE hostels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    status hostel_status DEFAULT 'active'
);

-- 6. Hostel_Years Table (Many-to-Many mapping)
CREATE TABLE hostel_years (
    hostel_id UUID REFERENCES hostels(id) ON DELETE CASCADE,
    academic_year INT NOT NULL CHECK (academic_year IN (1, 2, 3, 4)),
    PRIMARY KEY (hostel_id, academic_year)
);

-- 7. Floors Table
CREATE TABLE floors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hostel_id UUID NOT NULL REFERENCES hostels(id) ON DELETE CASCADE,
    floor_number INT NOT NULL,
    UNIQUE (hostel_id, floor_number)
);

-- 8. Rooms Table
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    room_number VARCHAR(50) NOT NULL,
    type VARCHAR(100),
    is_ac BOOLEAN DEFAULT false,
    capacity INT NOT NULL CHECK (capacity > 0),
    status room_status DEFAULT 'active',
    UNIQUE (floor_id, room_number)
);

-- 9. Beds Table
CREATE TABLE beds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    bed_number INT NOT NULL,
    status bed_status DEFAULT 'available',
    UNIQUE (room_id, bed_number)
);

-- 10. Bed Allocations Table
CREATE TABLE bed_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id),
    bed_id UUID NOT NULL REFERENCES beds(id),
    status allocation_status DEFAULT 'active',
    allocated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMP WITH TIME ZONE
);

-- Partial Unique Constraints for Allocation Integrity
CREATE UNIQUE INDEX unique_active_bed_allocation ON bed_allocations (bed_id) WHERE status = 'active';
CREATE UNIQUE INDEX unique_active_student_allocation ON bed_allocations (student_id) WHERE status = 'active';

-- 11. Outing Requests Table
CREATE TABLE outing_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id),
    out_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    in_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT NOT NULL,
    status outing_status DEFAULT 'pending',
    warden_id UUID REFERENCES wardens(id),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    CHECK (in_datetime > out_datetime)
);

-- Prevent multiple pending requests per student
CREATE UNIQUE INDEX unique_pending_outing_per_student ON outing_requests (student_id) WHERE status = 'pending';

-- 12. Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    outing_request_id UUID NOT NULL UNIQUE REFERENCES outing_requests(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    status notification_status DEFAULT 'pending',
    sent_at TIMESTAMP WITH TIME ZONE
);

-- 13. Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Row Level Security (RLS)
-- Deny direct client access. The Express backend will use the 'service_role' key.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE wardens ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE hostel_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE bed_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE outing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 15. RPC Function for Atomic Bed Allocation
CREATE OR REPLACE FUNCTION allocate_bed(p_student_id UUID, p_bed_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_bed_status bed_status;
    v_active_allocations INT;
    v_allocation_id UUID;
BEGIN
    -- Lock the bed row for update to prevent concurrent access
    SELECT status INTO v_bed_status 
    FROM beds 
    WHERE id = p_bed_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bed not found';
    END IF;

    -- Check bed availability
    IF v_bed_status != 'available' THEN
        RAISE EXCEPTION 'Bed is not available (Status: %)', v_bed_status;
    END IF;

    -- Check if student already has an active allocation
    SELECT count(*) INTO v_active_allocations 
    FROM bed_allocations 
    WHERE student_id = p_student_id AND status = 'active';

    IF v_active_allocations > 0 THEN
        RAISE EXCEPTION 'Student already has an active bed allocation';
    END IF;

    -- Update the bed status to 'allocated'
    UPDATE beds 
    SET status = 'allocated' 
    WHERE id = p_bed_id;

    -- Insert the new active allocation
    INSERT INTO bed_allocations (student_id, bed_id, status)
    VALUES (p_student_id, p_bed_id, 'active')
    RETURNING id INTO v_allocation_id;

    -- Return success message
    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Bed allocated successfully', 
        'allocation_id', v_allocation_id
    );

EXCEPTION WHEN OTHERS THEN
    -- Any exception will cause a rollback automatically.
    RETURN jsonb_build_object(
        'success', false, 
        'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Secure the RPC function: Do not allow arbitrary public execution
REVOKE EXECUTE ON FUNCTION allocate_bed(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION allocate_bed(UUID, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION allocate_bed(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION allocate_bed(UUID, UUID) TO service_role;
