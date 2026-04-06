-- ═══════════════════════════════════════════════════════════════════════
-- Migration: Add Chat, Tasks & Application Expiry
-- Run this ONCE against an existing database.
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Add 'expired' to applications status CHECK
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE applications ADD CONSTRAINT applications_status_check
  CHECK (status IN ('pending','under_review','shortlisted','offered','accepted','rejected','withdrawn','expired'));

-- 2. Add last_activity_at column (defaults to apply_date for existing rows)
ALTER TABLE applications ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP DEFAULT NOW();
UPDATE applications SET last_activity_at = apply_date WHERE last_activity_at IS NULL;

-- 3. Messages table
CREATE TABLE IF NOT EXISTS messages (
  message_id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
  sender_id      UUID NOT NULL,
  sender_role    VARCHAR(20) NOT NULL
                 CHECK (sender_role IN ('student','company')),
  content        TEXT NOT NULL,
  is_read        BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_application ON messages(application_id);
CREATE INDEX IF NOT EXISTS idx_messages_created     ON messages(application_id, created_at);

-- 4. Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  task_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(application_id) ON DELETE CASCADE,
  title          VARCHAR(300) NOT NULL,
  description    TEXT,
  deadline       TIMESTAMP NOT NULL,
  status         VARCHAR(20) DEFAULT 'pending'
                 CHECK (status IN ('pending','completed')),
  created_at     TIMESTAMP DEFAULT NOW(),
  updated_at     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_application ON tasks(application_id);
