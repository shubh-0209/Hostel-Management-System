-- Drop the unique constraint on outing_request_id if it exists
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_outing_request_id_key;

-- Make outing_request_id and recipient_email nullable to support in-app notifications
ALTER TABLE notifications ALTER COLUMN outing_request_id DROP NOT NULL;
ALTER TABLE notifications ALTER COLUMN recipient_email DROP NOT NULL;

-- Add new columns for generic notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Index for fetching user notifications sorted by recent first
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON notifications(user_id, created_at DESC);
