-- 1. ENUM CREATION & ALTERATION
CREATE TYPE application_type AS ENUM ('out_pass', 'leave');
CREATE TYPE leave_type AS ENUM ('home_leave', 'medical_leave', 'personal_leave', 'academic_leave', 'other');

ALTER TYPE outing_status ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE outing_status ADD VALUE IF NOT EXISTS 'checked_out';
ALTER TYPE outing_status ADD VALUE IF NOT EXISTS 'returned';
