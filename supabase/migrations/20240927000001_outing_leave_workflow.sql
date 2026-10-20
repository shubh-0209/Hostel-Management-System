-- 2. NEW COLUMNS & MODIFYING EXISTING COLUMNS
ALTER TABLE outing_requests
-- Drop NOT NULL so Leave applications don't require fake timestamps
ALTER COLUMN out_datetime DROP NOT NULL,
ALTER COLUMN in_datetime DROP NOT NULL,
-- Add new fields
ADD COLUMN application_type application_type DEFAULT 'out_pass' NOT NULL,
ADD COLUMN leave_from_date DATE,
ADD COLUMN leave_to_date DATE,
ADD COLUMN leave_type leave_type,
ADD COLUMN destination VARCHAR(255),
ADD COLUMN contact_info VARCHAR(255),
ADD COLUMN actual_out_datetime TIMESTAMP WITH TIME ZONE,
ADD COLUMN actual_in_datetime TIMESTAMP WITH TIME ZONE,
ADD COLUMN checked_out_by UUID REFERENCES wardens(id),
ADD COLUMN returned_by UUID REFERENCES wardens(id);


-- 3. CHECK CONSTRAINTS
-- Ensure Out Passes strictly use timestamp ranges
ALTER TABLE outing_requests 
ADD CONSTRAINT check_out_pass_dates CHECK (
    application_type != 'out_pass' OR 
    (out_datetime IS NOT NULL AND in_datetime IS NOT NULL AND in_datetime > out_datetime)
);

-- Ensure Leaves strictly use explicit DATE bounds
ALTER TABLE outing_requests 
ADD CONSTRAINT check_leave_dates CHECK (
    application_type != 'leave' OR 
    (leave_from_date IS NOT NULL AND leave_to_date IS NOT NULL AND leave_from_date <= leave_to_date)
);

-- Ensure only Leaves use the leave_type category
ALTER TABLE outing_requests
ADD CONSTRAINT check_leave_type CHECK (
    (application_type = 'out_pass' AND leave_type IS NULL) OR 
    (application_type = 'leave' AND leave_type IS NOT NULL)
);


-- 4. OVERLAP / CONFLICT PROTECTION
-- Drop the simplistic index that blocked multiple pending requests
DROP INDEX IF EXISTS unique_pending_outing_per_student;

-- Enable extension required for Exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Prevent ANY overlapping active applications (Out Pass vs Leave, Leave vs Leave, etc.)
-- Uses explicit Timezone conversion for India as requested
ALTER TABLE outing_requests 
ADD CONSTRAINT prevent_overlapping_active_applications 
EXCLUDE USING gist (
  student_id WITH =,
  tstzrange(
    COALESCE(
      out_datetime,
      leave_from_date::timestamp AT TIME ZONE 'Asia/Kolkata'
    ),
    COALESCE(
      in_datetime,
      (leave_to_date + 1)::timestamp AT TIME ZONE 'Asia/Kolkata'
    ),
    '[)'
  ) WITH &&
) WHERE (status IN ('pending', 'approved', 'checked_out'));
