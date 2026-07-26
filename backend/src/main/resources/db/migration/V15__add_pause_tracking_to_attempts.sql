-- Migration V15: Add pause tracking columns to attempts table
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE attempts ADD COLUMN IF NOT EXISTS paused_duration_seconds BIGINT DEFAULT 0;
