-- ═══════════════════════════════════════════════════════════════════════
-- SmartNiyukti — Internship & Job Management System (PostgreSQL Schema)
-- ═══════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Coordinators ─────────────────────────────────────────────────────
CREATE TABLE coordinators (
  coordinator_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(150) NOT NULL,
  email           VARCHAR(150) UNIQUE NOT NULL,
  phone           VARCHAR(20),
  password_hash   TEXT NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ─── Students ─────────────────────────────────────────────────────────
CREATE TABLE students (
  student_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(150) NOT NULL,
  email           VARCHAR(150) UNIQUE NOT NULL,
  phone           VARCHAR(20),
  password_hash   TEXT NOT NULL,
  cgpa            DECIMAL(4,2),
  coordinator_id  UUID REFERENCES coordinators(coordinator_id) ON DELETE SET NULL,
  resume_url      TEXT,
  skills          TEXT[],
  education       JSONB DEFAULT '[]',
  experience      JSONB DEFAULT '[]',
  projects        JSONB DEFAULT '[]',
  experience_years NUMERIC(4,1) DEFAULT 0,
  linkedin_url    TEXT,
  github_url      TEXT,
  portfolio_url   TEXT,
  location        VARCHAR(200),
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ─── Companies ────────────────────────────────────────────────────────
CREATE TABLE companies (
  company_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(200) NOT NULL,
  industry        VARCHAR(100),
  location        VARCHAR(200),
  contact_email   VARCHAR(150) UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  coordinator_id  UUID REFERENCES coordinators(coordinator_id) ON DELETE SET NULL,
  website         VARCHAR(255),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ─── Internships ──────────────────────────────────────────────────────
CREATE TABLE internships (
  internship_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           VARCHAR(200) NOT NULL,
  stipend         DECIMAL(10,2) DEFAULT 0.00,
  duration        VARCHAR(100),
  description     TEXT,
  company_id      UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  required_experience_years NUMERIC(4,1) DEFAULT 0,
  deadline        TIMESTAMP,
  status          VARCHAR(20) DEFAULT 'open'
                  CHECK (status IN ('open', 'closed', 'filled')),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ─── Jobs ─────────────────────────────────────────────────────────────
CREATE TABLE jobs (
  job_id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_title       VARCHAR(200) NOT NULL,
  salary          DECIMAL(12,2),
  location        VARCHAR(200),
  description     TEXT,
  company_id      UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  required_experience_years NUMERIC(4,1) DEFAULT 0,
  deadline        TIMESTAMP,
  status          VARCHAR(20) DEFAULT 'open'
                  CHECK (status IN ('open', 'closed', 'filled')),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ─── Applications ─────────────────────────────────────────────────────
CREATE TABLE applications (
  application_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apply_date       TIMESTAMP DEFAULT NOW(),
  status           VARCHAR(30) DEFAULT 'pending'
                   CHECK (status IN ('pending','under_review','shortlisted','offered','accepted','rejected','withdrawn')),
  student_id       UUID REFERENCES students(student_id) ON DELETE CASCADE,
  internship_id    UUID REFERENCES internships(internship_id) ON DELETE CASCADE,
  job_id           UUID REFERENCES jobs(job_id) ON DELETE CASCADE,
  application_type VARCHAR(20) NOT NULL
                   CHECK (application_type IN ('internship','job')),
  UNIQUE(student_id, internship_id),
  UNIQUE(student_id, job_id),
  CONSTRAINT chk_one_target CHECK (
    (application_type = 'internship' AND internship_id IS NOT NULL AND job_id IS NULL) OR
    (application_type = 'job'        AND job_id IS NOT NULL        AND internship_id IS NULL)
  )
);

-- ─── Interviews ───────────────────────────────────────────────────────
CREATE TABLE interviews (
  interview_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date            TIMESTAMP NOT NULL,
  application_id  UUID REFERENCES applications(application_id) ON DELETE CASCADE,
  round           VARCHAR(50),
  mode            VARCHAR(30)
                  CHECK (mode IN ('online','offline','telephonic')),
  result          VARCHAR(30) DEFAULT 'pending'
                  CHECK (result IN ('pending','passed','failed','no_show')),
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ─── Offers ───────────────────────────────────────────────────────────
CREATE TABLE offers (
  offer_id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_date       TIMESTAMP DEFAULT NOW(),
  status           VARCHAR(30) DEFAULT 'pending'
                   CHECK (status IN ('pending','accepted','rejected','expired')),
  application_id   UUID REFERENCES applications(application_id) ON DELETE CASCADE,
  offer_letter_url TEXT,
  deadline         TIMESTAMP,
  created_at       TIMESTAMP DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────
CREATE INDEX idx_students_coordinator    ON students(coordinator_id);
CREATE INDEX idx_companies_coordinator   ON companies(coordinator_id);
CREATE INDEX idx_internships_company     ON internships(company_id);
CREATE INDEX idx_jobs_company            ON jobs(company_id);
CREATE INDEX idx_applications_student    ON applications(student_id);
CREATE INDEX idx_applications_internship ON applications(internship_id);
CREATE INDEX idx_applications_job        ON applications(job_id);
CREATE INDEX idx_applications_status     ON applications(status);
CREATE INDEX idx_interviews_application  ON interviews(application_id);
CREATE INDEX idx_offers_application      ON offers(application_id);
