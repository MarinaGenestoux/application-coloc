-- Create colocations table
CREATE TABLE colocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invite_code VARCHAR(8) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create colocation_members table
CREATE TABLE colocation_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    colocation_id UUID NOT NULL REFERENCES colocations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(colocation_id, user_id)
);

-- Indexes
CREATE INDEX idx_colocations_created_by ON colocations(created_by);
CREATE INDEX idx_colocations_invite_code ON colocations(invite_code);
CREATE INDEX idx_colocation_members_user ON colocation_members(user_id);
CREATE INDEX idx_colocation_members_colocation ON colocation_members(colocation_id);
