-- V13: Exam Max Violations Threshold, Violation Severity, and Snapshot Storage

-- 1. Add configurable max_violations column to exams table (default 3 violations)
ALTER TABLE exams ADD COLUMN max_violations INT DEFAULT 3 NOT NULL;

-- 2. Add severity column to proctor_violations table
ALTER TABLE proctor_violations ADD COLUMN severity VARCHAR(10) DEFAULT 'MEDIUM' NOT NULL;

-- 3. Create exam_snapshots table for storing webcam capture references
CREATE TABLE exam_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
    file_path VARCHAR(512) NOT NULL,
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_snapshots_attempt ON exam_snapshots(attempt_id);
