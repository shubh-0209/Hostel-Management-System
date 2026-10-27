-- Migration: 20241027000000_mess_menu_schema.sql
-- Create Mess Menu Table for recurring weekly schedules

CREATE TABLE IF NOT EXISTS mess_menus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hostel_id UUID NOT NULL REFERENCES hostels(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'snacks', 'dinner')),
    menu_items TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_hostel_day_meal UNIQUE (hostel_id, day_of_week, meal_type)
);

-- Deny direct client access. The Express backend will use the 'service_role' key.
ALTER TABLE mess_menus ENABLE ROW LEVEL SECURITY;

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_mess_menus_hostel ON mess_menus(hostel_id);
CREATE INDEX IF NOT EXISTS idx_mess_menus_hostel_day ON mess_menus(hostel_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_mess_menus_meal_type ON mess_menus(meal_type);

-- Trigger function for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_mess_menus_updated_at'
    ) THEN
        CREATE TRIGGER update_mess_menus_updated_at
        BEFORE UPDATE ON mess_menus
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
