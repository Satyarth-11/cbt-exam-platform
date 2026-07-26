-- V11: Add Proctoring Violations Table

CREATE TABLE proctor_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
    violation_type VARCHAR(50) NOT NULL, -- TAB_SWITCH, FULLSCREEN_EXIT, FACE_MISSING, MULTIPLE_FACES
    details VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_proctor_violations_attempt ON proctor_violations(attempt_id);
