-- ═══════════════════════════════════════════════════════════════════════
-- Migration 002: Add task submission columns
-- ═══════════════════════════════════════════════════════════════════════

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS submission_file_url TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS submission_link TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS submission_notes TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;
