CREATE TABLE IF NOT EXISTS maintenance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hostel_id UUID NOT NULL REFERENCES hostels(id) ON DELETE CASCADE,
    room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
    issue_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'cancelled')),
    reported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_maintenance_reported_by ON maintenance_requests(reported_by);
CREATE INDEX IF NOT EXISTS idx_maintenance_hostel ON maintenance_requests(hostel_id);
