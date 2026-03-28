# 🎓 Master Project Prompt: Internship and Job Management System

> Full-Stack MERN-style App — React 18 · Vite · TailwindCSS · Node.js · Express · **PostgreSQL (pg)**
> Entities: Coordinator · Student · Company · Internship · Job · Application · Interview · Offer · Onboarding

You are an expert full-stack developer. Do not be lazy. Be architectural. Fix root causes, not symptoms.

---

## 0. 🧠 Reasoning Rules (MANDATORY)

- **STOP & THINK** before writing code. Analyze the dependency tree.
- **Plan First:** If a task touches >1 file, outline 3 bullet points before executing.
- **READ FULL FILES** before editing. Never guess imports or function signatures.
- **No Placeholders:** Never write `// ...existing code...`. Write complete implementations.
- **Verify:** After every edit, confirm all imports resolve and all routes are registered in `server.js`.
- **PostgreSQL ONLY:** Use `pg` Pool with raw SQL. No ORM, no Mongoose, no MongoDB.

---

## 1. 📂 Project Architecture

```
internship-job/
├── client/                        # React 18 + Vite + TailwindCSS
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── ui/                # Button, Card, Input, Badge, Modal, StatusBadge
│       │   ├── auth/              # LoginPage, RegisterPage (Student & Coordinator)
│       │   ├── layout/            # Navbar, Sidebar, Footer
│       │   └── shared/            # InterviewCard, OfferCard, OnboardingTracker,
│       │                          # ApplicationTimeline, StatsWidget
│       ├── pages/
│       │   ├── coordinator/
│       │   │   ├── CoordinatorDashboard.jsx
│       │   │   ├── ManageStudents.jsx
│       │   │   ├── ManageCompanies.jsx
│       │   │   ├── ManageApplications.jsx
│       │   │   └── ReportsPage.jsx
│       │   ├── student/
│       │   │   ├── StudentDashboard.jsx
│       │   │   ├── InternshipListing.jsx
│       │   │   ├── InternshipDetail.jsx
│       │   │   ├── JobListing.jsx
│       │   │   ├── JobDetail.jsx
│       │   │   └── MyApplications.jsx
│       │   ├── company/
│       │   │   ├── CompanyDashboard.jsx
│       │   │   ├── PostInternship.jsx
│       │   │   └── PostJob.jsx
│       │   ├── LandingPage.jsx
│       │   ├── LoginPage.jsx
│       │   └── RegisterPage.jsx
│       ├── context/
│       │   ├── AuthContext.jsx        # Student + Coordinator session
│       │   ├── CompanyContext.jsx
│       │   └── ApplicationContext.jsx
│       ├── lib/
│       │   └── axiosInstance.js       # Single axios instance
│       ├── utils/
│       │   └── api.js                 # Centralized API calls
│       ├── App.jsx
│       └── main.jsx
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js              # pg Pool singleton
│   │   │   └── env.js             # Validated env vars (fail fast)
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js  # JWT protect + roleGuard
│   │   │   ├── errorHandler.js
│   │   │   ├── notFound.js
│   │   │   └── upload.js          # Multer: resume upload
│   │   ├── utils/
│   │   │   ├── asyncHandler.js
│   │   │   ├── ApiError.js
│   │   │   └── ApiResponse.js
│   │   └── modules/
│   │       ├── auth/              # login/register for students + coordinators + companies
│   │       ├── coordinators/      # student management, company management, reports
│   │       ├── students/          # profile, my applications, dashboard stats
│   │       ├── companies/         # profile, post internship/job, view applicants
│   │       ├── internships/       # CRUD + apply
│   │       ├── jobs/        # CRUD + apply
│   │       ├── applications/      # unified application lifecycle
│   │       ├── interviews/        # schedule, update round/result
│   │       ├── offers/            # issue offer, update status
│   │       └── onboarding/        # joining date, onboarding status
│   ├── seed/
│   │   └── seed.js
│   ├── schema.sql
│   └── server.js
│
├── .env.example
├── package.json                   # root: concurrently
└── README.md
```

---

## 2. 🗄️ PostgreSQL Schema (`schema.sql`)

> Use `pg` Pool directly — **no ORM**. All queries live in controller files.

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Coordinators ─────────────────────────────────────────────────────────────
CREATE TABLE coordinators (
  coordinator_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(150) NOT NULL,
  email           VARCHAR(150) UNIQUE NOT NULL,
  phone           VARCHAR(20),
  password_hash   TEXT NOT NULL,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ─── Students ─────────────────────────────────────────────────────────────────
CREATE TABLE students (
  student_id      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            VARCHAR(150) NOT NULL,
  email           VARCHAR(150) UNIQUE NOT NULL,
  phone           VARCHAR(20),
  password_hash   TEXT NOT NULL,
  gpa             DECIMAL(4,2),
  coordinator_id  UUID REFERENCES coordinators(coordinator_id) ON DELETE SET NULL,
  resume_url      TEXT,
  skills          TEXT[],
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ─── Companies ────────────────────────────────────────────────────────────────
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

-- ─── Internships ──────────────────────────────────────────────────────────────
CREATE TABLE internships (
  internship_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           VARCHAR(200) NOT NULL,
  stipend         DECIMAL(10,2) DEFAULT 0.00,
  duration        VARCHAR(100),                -- e.g. "6 months", "12 weeks"
  description     TEXT,
  company_id      UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  status          VARCHAR(20) DEFAULT 'open'
                  CHECK (status IN ('open', 'closed', 'filled')),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ─── Jobs ───────────────────────────────────────────────────────────────
CREATE TABLE jobs (
  job_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_title       VARCHAR(200) NOT NULL,
  salary          DECIMAL(12,2),
  location        VARCHAR(200),
  description     TEXT,
  company_id      UUID REFERENCES companies(company_id) ON DELETE CASCADE,
  status          VARCHAR(20) DEFAULT 'open'
                  CHECK (status IN ('open', 'closed', 'filled')),
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ─── Applications ─────────────────────────────────────────────────────────────
-- A student can apply to an internship OR a job (not both in one row).
-- Use application_type to differentiate; enforce via check constraint.
CREATE TABLE applications (
  application_id  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  apply_date      TIMESTAMP DEFAULT NOW(),
  status          VARCHAR(30) DEFAULT 'pending'
                  CHECK (status IN ('pending', 'under_review', 'shortlisted', 'offered', 'accepted', 'rejected', 'withdrawn')),
  student_id      UUID REFERENCES students(student_id) ON DELETE CASCADE,
  internship_id   UUID REFERENCES internships(internship_id) ON DELETE CASCADE,
  job_id    UUID REFERENCES jobs(job_id) ON DELETE CASCADE,
  application_type VARCHAR(20) NOT NULL
                  CHECK (application_type IN ('internship', 'job')),
  UNIQUE(student_id, internship_id),
  UNIQUE(student_id, job_id),
  CONSTRAINT chk_one_target CHECK (
    (application_type = 'internship' AND internship_id IS NOT NULL AND job_id IS NULL) OR
    (application_type = 'job'  AND job_id  IS NOT NULL AND internship_id IS NULL)
  )
);

-- ─── Interviews ───────────────────────────────────────────────────────────────
CREATE TABLE interviews (
  interview_id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date            TIMESTAMP NOT NULL,
  application_id  UUID REFERENCES applications(application_id) ON DELETE CASCADE,
  round           VARCHAR(50),               -- e.g. "Round 1", "HR Round", "Technical"
  mode            VARCHAR(30)
                  CHECK (mode IN ('online', 'offline', 'telephonic')),
  result          VARCHAR(30) DEFAULT 'pending'
                  CHECK (result IN ('pending', 'passed', 'failed', 'no_show')),
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ─── Offers ───────────────────────────────────────────────────────────────────
CREATE TABLE offers (
  offer_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  offer_date      TIMESTAMP DEFAULT NOW(),
  status          VARCHAR(30) DEFAULT 'pending'
                  CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  application_id  UUID REFERENCES applications(application_id) ON DELETE CASCADE,
  offer_letter_url TEXT,
  deadline        TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- ─── Onboarding ───────────────────────────────────────────────────────────────
CREATE TABLE onboarding (
  onboarding_id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  joining_date    TIMESTAMP,
  status          VARCHAR(30) DEFAULT 'pending'
                  CHECK (status IN ('pending', 'documents_submitted', 'in_progress', 'completed', 'cancelled')),
  offer_id        UUID UNIQUE REFERENCES offers(offer_id) ON DELETE CASCADE,
  notes           TEXT,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX idx_students_coordinator      ON students(coordinator_id);
CREATE INDEX idx_companies_coordinator     ON companies(coordinator_id);
CREATE INDEX idx_internships_company       ON internships(company_id);
CREATE INDEX idx_jobs_company        ON jobs(company_id);
CREATE INDEX idx_applications_student      ON applications(student_id);
CREATE INDEX idx_applications_internship   ON applications(internship_id);
CREATE INDEX idx_applications_job    ON applications(job_id);
CREATE INDEX idx_applications_status       ON applications(status);
CREATE INDEX idx_interviews_application    ON interviews(application_id);
CREATE INDEX idx_offers_application        ON offers(application_id);
```

---

## 3. 🔩 Module Structure (every feature follows this)

```
server/src/modules/[feature]/
├── [feature].controller.js   # All handlers — import pool from config/db.js
├── [feature].routes.js       # Express router
└── [feature].validation.js   # Input validation (optional but recommended)
```

**Golden Rule:** Controllers import `pool` from `../../config/db.js`, `asyncHandler` from `../../utils/asyncHandler.js`, `ApiError`/`ApiResponse` from utils. No module reaches into another module's files — only shared utils/config/middleware.

**`server.js` mounts all routers:**
```js
app.use('/api/auth',          authRoutes);
app.use('/api/coordinators',  coordinatorRoutes);
app.use('/api/students',      studentRoutes);
app.use('/api/companies',     companyRoutes);
app.use('/api/internships',   internshipRoutes);
app.use('/api/jobs',    jobRoutes);
app.use('/api/applications',  applicationRoutes);
app.use('/api/interviews',    interviewRoutes);
app.use('/api/offers',        offerRoutes);
app.use('/api/onboarding',    onboardingRoutes);
```

---

## 4. ⚙️ Config & Shared Utils

### `config/db.js` — pg Pool
```js
const { Pool } = require('pg');
const ENV = require('./env.js');
const pool = new Pool({ connectionString: ENV.DATABASE_URL });
pool.on('error', (err) => console.error('PG idle client error:', err));
module.exports = pool;
```

### `config/env.js` — Fail Fast
```js
require('dotenv').config();
const ENV = {
  PORT:           process.env.PORT || 5001,
  DATABASE_URL:   process.env.DATABASE_URL,
  JWT_SECRET:     process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL:     process.env.CLIENT_URL || 'http://localhost:5173',
  UPLOAD_DIR:     process.env.UPLOAD_DIR || './uploads',
};
['DATABASE_URL', 'JWT_SECRET'].forEach(k => {
  if (!ENV[k]) { console.error(`Missing env var: ${k}`); process.exit(1); }
});
module.exports = ENV;
```

### `utils/asyncHandler.js`
```js
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
module.exports = asyncHandler;
```

### `utils/ApiError.js`
```js
class ApiError extends Error {
  constructor(statusCode, message = 'Something went wrong', errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;
  }
}
module.exports = ApiError;
```

### `utils/ApiResponse.js`
```js
class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}
module.exports = ApiResponse;
```

### `middleware/authMiddleware.js`
```js
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError.js');
const asyncHandler = require('../utils/asyncHandler.js');
const ENV = require('../config/env.js');

const protect = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new ApiError(401, 'No token provided');
  req.user = jwt.verify(token, ENV.JWT_SECRET);
  next();
});

const roleGuard = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    throw new ApiError(403, 'Access forbidden');
  next();
};

module.exports = { protect, roleGuard };
```

---

## 5. 📡 API Modules — Full Endpoint List

### AUTH `/api/auth`
| Method | Path                         | Role   | Description                              |
|--------|------------------------------|--------|------------------------------------------|
| POST   | `/students/register`         | Public | Register student → return JWT            |
| POST   | `/students/login`            | Public | Student login → JWT                      |
| POST   | `/coordinators/register`     | Public | Register coordinator → JWT               |
| POST   | `/coordinators/login`        | Public | Coordinator login → JWT                  |
| POST   | `/companies/register`        | Public | Register company → JWT                   |
| POST   | `/companies/login`           | Public | Company login → JWT                      |
| GET    | `/me`                        | Auth   | Return own profile based on role in JWT  |

### COORDINATORS `/api/coordinators`
| Method | Path                                 | Role        | Description                                      |
|--------|--------------------------------------|-------------|--------------------------------------------------|
| GET    | `/students`                          | coordinator | List all students under this coordinator         |
| GET    | `/students/:id`                      | coordinator | Single student profile                           |
| PUT    | `/students/:id`                      | coordinator | Update student record                            |
| DELETE | `/students/:id`                      | coordinator | Remove student                                   |
| GET    | `/companies`                         | coordinator | List all companies linked to this coordinator    |
| GET    | `/companies/:id`                     | coordinator | Single company details                           |
| GET    | `/applications`                      | coordinator | All applications under this coordinator's students |
| GET    | `/applications/:id`                  | coordinator | Single application with full lifecycle details   |
| PUT    | `/applications/:id/status`           | coordinator | Update application status                        |
| GET    | `/reports/summary`                   | coordinator | Aggregated stats: jobs, internships, offers|

### STUDENTS `/api/students`
| Method | Path                        | Role    | Description                                    |
|--------|-----------------------------|---------|------------------------------------------------|
| GET    | `/profile`                  | student | Own profile                                    |
| PUT    | `/profile`                  | student | Update profile (name, phone, GPA, skills)      |
| POST   | `/resume/upload`            | student | Multer PDF upload → set `resume_url`           |
| GET    | `/applications`             | student | All own applications with status               |
| GET    | `/applications/:id`         | student | Single application timeline (interviews, offer, onboarding) |
| GET    | `/dashboard`                | student | Stats: total applied, interviews, offers, jobs |

### COMPANIES `/api/companies`
| Method | Path                               | Role    | Description                              |
|--------|------------------------------------|---------|------------------------------------------|
| GET    | `/profile`                         | company | Own company profile                      |
| PUT    | `/profile`                         | company | Update company details                   |
| GET    | `/internships`                     | company | Own internship listings                  |
| GET    | `/jobs`                      | company | Own job listings                   |
| GET    | `/internships/:id/applicants`      | company | Students who applied to this internship  |
| GET    | `/jobs/:id/applicants`       | company | Students who applied to this job   |
| PUT    | `/applications/:appId/status`      | company | Move application: shortlist/offer/reject |

### INTERNSHIPS `/api/internships`
| Method | Path            | Role      | Description                                          |
|--------|-----------------|-----------|------------------------------------------------------|
| GET    | `/`             | Public    | Browse internships; filter by company, location, stipend |
| GET    | `/:id`          | Public    | Internship detail + company info                     |
| POST   | `/`             | company   | Create internship listing                            |
| PUT    | `/:id`          | company   | Update internship                                    |
| DELETE | `/:id`          | company   | Delete internship                                    |
| POST   | `/:id/apply`    | student   | Apply to internship → creates `application` row      |

### PLACEMENTS `/api/jobs`
| Method | Path            | Role      | Description                                          |
|--------|-----------------|-----------|------------------------------------------------------|
| GET    | `/`             | Public    | Browse jobs; filter by company, location, salary |
| GET    | `/:id`          | Public    | Job detail + company info                      |
| POST   | `/`             | company   | Create job listing                             |
| PUT    | `/:id`          | company   | Update job                                     |
| DELETE | `/:id`          | company   | Delete job                                     |
| POST   | `/:id/apply`    | student   | Apply to job → creates `application` row       |

### APPLICATIONS `/api/applications`
| Method | Path              | Role                  | Description                               |
|--------|-------------------|-----------------------|-------------------------------------------|
| GET    | `/:id`            | student/coordinator   | Full application with interview + offer + onboarding |
| PUT    | `/:id/withdraw`   | student               | Withdraw application → status='withdrawn' |
| PUT    | `/:id/status`     | company/coordinator   | Update status                             |

### INTERVIEWS `/api/interviews`
| Method | Path              | Role                  | Description                                      |
|--------|-------------------|-----------------------|--------------------------------------------------|
| POST   | `/`               | company/coordinator   | Schedule interview for an application            |
| GET    | `/application/:applicationId` | student/coordinator/company | All interview rounds for an application |
| PUT    | `/:id`            | company/coordinator   | Update round, mode, date, result, notes          |
| DELETE | `/:id`            | company/coordinator   | Cancel interview                                 |

### OFFERS `/api/offers`
| Method | Path              | Role                  | Description                                      |
|--------|-------------------|-----------------------|--------------------------------------------------|
| POST   | `/`               | company/coordinator   | Issue offer for an application                   |
| GET    | `/application/:applicationId` | student/coordinator/company | Get offer for an application      |
| PUT    | `/:id/accept`     | student               | Accept offer → update `offers.status='accepted'`, `applications.status='accepted'` |
| PUT    | `/:id/reject`     | student               | Reject offer → status='rejected'                 |
| PUT    | `/:id`            | company/coordinator   | Update offer details / deadline                  |

### ONBOARDING `/api/onboarding`
| Method | Path              | Role                  | Description                                      |
|--------|-------------------|-----------------------|--------------------------------------------------|
| POST   | `/`               | coordinator/company   | Initiate onboarding for an accepted offer        |
| GET    | `/offer/:offerId` | student/coordinator/company | Get onboarding record for an offer          |
| PUT    | `/:id`            | coordinator           | Update joining_date, status, notes               |

---

## 6. 🔗 Entity Relationships (reference from schema)

```
Student.coordinator_id      →  coordinators.coordinator_id
Company.coordinator_id      →  coordinators.coordinator_id
Internship.company_id       →  companies.company_id
Job.company_id        →  companies.company_id
Application.student_id      →  students.student_id
Application.internship_id   →  internships.internship_id  (nullable)
Application.job_id    →  jobs.job_id    (nullable)
Interview.application_id    →  applications.application_id
Offer.application_id        →  applications.application_id
Onboarding.offer_id         →  offers.offer_id
```

**Lifecycle flow:**
```
Student applies → Application (pending)
                            ↓
              Coordinator/Company schedules Interview(s)
                            ↓
              Company issues Offer
                            ↓
              Student accepts/rejects Offer
                            ↓
              Coordinator initiates Onboarding (if accepted)
```

---

## 7. 🎨 Frontend Architecture

### Routes in `App.jsx`
```jsx
// Public
<Route path="/"                          element={<LandingPage />} />
<Route path="/login"                     element={<LoginPage />} />
<Route path="/register"                  element={<RegisterPage />} />

// Student (protected)
<Route path="/student/dashboard"         element={<StudentDashboard />} />
<Route path="/student/applications"      element={<MyApplications />} />
<Route path="/student/applications/:id"  element={<ApplicationTimeline />} />
<Route path="/internships"               element={<InternshipListing />} />
<Route path="/internships/:id"           element={<InternshipDetail />} />
<Route path="/jobs"                element={<JobListing />} />
<Route path="/jobs/:id"            element={<JobDetail />} />

// Coordinator (protected)
<Route path="/coordinator/dashboard"     element={<CoordinatorDashboard />} />
<Route path="/coordinator/students"      element={<ManageStudents />} />
<Route path="/coordinator/companies"     element={<ManageCompanies />} />
<Route path="/coordinator/applications"  element={<ManageApplications />} />
<Route path="/coordinator/reports"       element={<ReportsPage />} />

// Company (protected)
<Route path="/company/dashboard"         element={<CompanyDashboard />} />
<Route path="/company/internships/post"  element={<PostInternship />} />
<Route path="/company/jobs/post"   element={<PostJob />} />
```

### Context Providers (wrap in `App.jsx`)
```jsx
<AuthProvider>
  <CompanyProvider>
    <ApplicationProvider>
      <AppRoutes />
    </ApplicationProvider>
  </CompanyProvider>
</AuthProvider>
```

### `AuthContext` — manages both Student and Coordinator sessions
Stores: `{ user, token, role, login, logout, updateUser, isAuthenticated, loading }`  
Persists to `localStorage` under keys `ips_token`, `ips_user`, `ips_role`.

### Key Frontend Components

| Component                 | Description                                                    |
|---------------------------|----------------------------------------------------------------|
| `Navbar.jsx`              | Role-aware navigation (student / coordinator / company links)  |
| `ApplicationTimeline.jsx` | Step-by-step timeline: Applied → Interview → Offer → Onboarding|
| `InterviewCard.jsx`       | Shows round, mode, date, result badge per interview entry      |
| `OfferCard.jsx`           | Offer details with Accept / Reject CTA buttons                 |
| `OnboardingTracker.jsx`   | Joining date + onboarding status progress bar                  |
| `StatsWidget.jsx`         | Reusable card for dashboard numeric stat display               |
| `StatusBadge.jsx`         | Color-coded pill for application/offer/onboarding status       |

### `utils/api.js` — Centralized API Calls

```js
import axios from '../lib/axiosInstance.js';

export const studentAPI = {
  getProfile:        ()          => axios.get('/api/students/profile'),
  updateProfile:     (data)      => axios.put('/api/students/profile', data),
  uploadResume:      (file)      => {
    const fd = new FormData(); fd.append('resume', file);
    return axios.post('/api/students/resume/upload', fd);
  },
  getApplications:   ()          => axios.get('/api/students/applications'),
  getApplication:    (id)        => axios.get(`/api/students/applications/${id}`),
  getDashboard:      ()          => axios.get('/api/students/dashboard'),
};

export const internshipAPI = {
  list:    (params) => axios.get('/api/internships', { params }),
  detail:  (id)     => axios.get(`/api/internships/${id}`),
  apply:   (id)     => axios.post(`/api/internships/${id}/apply`),
};

export const jobAPI = {
  list:    (params) => axios.get('/api/jobs', { params }),
  detail:  (id)     => axios.get(`/api/jobs/${id}`),
  apply:   (id)     => axios.post(`/api/jobs/${id}/apply`),
};

export const offerAPI = {
  accept:  (id)     => axios.put(`/api/offers/${id}/accept`),
  reject:  (id)     => axios.put(`/api/offers/${id}/reject`),
};

export const coordinatorAPI = {
  getStudents:       ()          => axios.get('/api/coordinators/students'),
  getApplications:   ()          => axios.get('/api/coordinators/applications'),
  updateAppStatus:   (id, data)  => axios.put(`/api/coordinators/applications/${id}/status`, data),
  getReports:        ()          => axios.get('/api/coordinators/reports/summary'),
};

export const companyAPI = {
  getProfile:        ()          => axios.get('/api/companies/profile'),
  getInternships:    ()          => axios.get('/api/companies/internships'),
  getJobs:     ()          => axios.get('/api/companies/jobs'),
  postInternship:    (data)      => axios.post('/api/internships', data),
  postJob:     (data)      => axios.post('/api/jobs', data),
  getApplicants:     (type, id)  => axios.get(`/api/companies/${type}/${id}/applicants`),
  scheduleInterview: (data)      => axios.post('/api/interviews', data),
  issueOffer:        (data)      => axios.post('/api/offers', data),
};
```

---

## 8. 🌱 Seed Data (`server/seed/seed.js`)

```sql
-- Coordinator
INSERT INTO coordinators (name, email, phone, password_hash)
VALUES ('Dr. Anjali Mehta', 'coordinator@college.edu', '9000000001', '<bcrypt_hash>');

-- Company
INSERT INTO companies (name, industry, location, contact_email, password_hash, coordinator_id)
VALUES ('Infosys Limited', 'IT Services', 'Bengaluru', 'hr@infosys.com', '<bcrypt_hash>',
        (SELECT coordinator_id FROM coordinators WHERE email='coordinator@college.edu'));

-- Student
INSERT INTO students (name, email, phone, password_hash, gpa, coordinator_id, skills)
VALUES ('Rahul Kumar', 'rahul@student.edu', '9876543210', '<bcrypt_hash>', 8.5,
        (SELECT coordinator_id FROM coordinators WHERE email='coordinator@college.edu'),
        ARRAY['Python','SQL','React']);

-- Internship
INSERT INTO internships (title, stipend, duration, description, company_id, status)
VALUES ('Data Analyst Intern', 15000.00, '6 months', 'Work on BI dashboards and data pipelines.',
        (SELECT company_id FROM companies WHERE contact_email='hr@infosys.com'), 'open');

-- Job
INSERT INTO jobs (job_title, salary, location, description, company_id, status)
VALUES ('Software Engineer', 1200000.00, 'Bengaluru', 'Full-time SWE role — 1 year bond.',
        (SELECT company_id FROM companies WHERE contact_email='hr@infosys.com'), 'open');
```

---

## 9. 📋 Environment Variables

```env
# server/.env
PORT=5001
DATABASE_URL=postgresql://postgres:password@localhost:5432/internship_job_db
JWT_SECRET=change_this_to_a_256bit_random_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
UPLOAD_DIR=./uploads
NODE_ENV=development

# client/.env
VITE_API_URL=http://localhost:5001
```

---

## 10. 📦 Dependencies

```json
// server/package.json
{
  "scripts": {
    "dev":   "nodemon server.js",
    "start": "node server.js",
    "seed":  "node seed/seed.js"
  },
  "dependencies": {
    "express":     "^4.18.2",
    "pg":          "^8.11.3",
    "bcryptjs":    "^2.4.3",
    "jsonwebtoken":"^9.0.2",
    "cors":        "^2.8.5",
    "dotenv":      "^16.3.1",
    "multer":      "^1.4.5",
    "morgan":      "^1.10.0"
  },
  "devDependencies": { "nodemon": "^3.0.2" }
}

// client/package.json
{
  "dependencies": {
    "react":          "^18.2.0",
    "react-dom":      "^18.2.0",
    "react-router-dom":"^6.20.1",
    "axios":          "^1.6.2",
    "react-icons":    "^4.12.0",
    "recharts":       "^2.15.4"
  },
  "devDependencies": {
    "@vitejs/plugin-react":"^4.3.1",
    "tailwindcss":    "^3.4.4",
    "autoprefixer":   "^10.4.19",
    "postcss":        "^8.4.38",
    "vite":           "^5.3.1"
  }
}

// root/package.json
{
  "scripts": {
    "dev":         "concurrently \"npm run dev --prefix server\" \"npm run dev --prefix client\"",
    "install:all": "npm i && npm i --prefix client && npm i --prefix server"
  },
  "devDependencies": { "concurrently": "^8.2.0" }
}
```

---

## 11. ✅ Implementation Order

```
BACKEND
1.  schema.sql — run in psql to create all tables
2.  server.js skeleton + pg Pool connecting
3.  config/env.js (fail fast on missing vars)
4.  utils/ — asyncHandler, ApiError, ApiResponse
5.  middleware/ — authMiddleware (JWT), errorHandler, notFound, upload (Multer)
6.  modules/auth/ — register + login for students, coordinators, companies
7.  modules/students/ — profile, resume upload, applications, dashboard
8.  modules/companies/ — profile, post internship/job, view applicants, schedule interview, issue offer
9.  modules/internships/ — CRUD + apply
10. modules/jobs/ — CRUD + apply (mirrors internships)
11. modules/applications/ — GET, withdraw, status update
12. modules/interviews/ — schedule, list, update, delete
13. modules/offers/ — issue, accept, reject, update
14. modules/onboarding/ — initiate, get, update
15. modules/coordinators/ — student mgmt, company view, application oversight, reports
16. seed/seed.js — run once, verify all tables populated

FRONTEND
17. Set up Vite project + TailwindCSS + axiosInstance with baseURL + token interceptor
18. AuthContext (student/coordinator/company roles)
19. LandingPage, LoginPage, RegisterPage
20. Student: InternshipListing → InternshipDetail → apply flow
21. Student: JobListing → JobDetail → apply flow
22. Student: MyApplications → ApplicationTimeline (interview + offer + onboarding)
23. Company: CompanyDashboard (tabs: Internships, Jobs) + PostInternship/PostJob modals
24. Company: Applicant list → schedule interview → issue offer
25. Coordinator: CoordinatorDashboard → ManageStudents, ManageCompanies, ManageApplications
26. Coordinator: ReportsPage with Recharts (jobs count, offers accepted rate, industry breakdown)
27. End-to-end test all 3 roles: register → apply → interview → offer → onboarding
```

---

## 12. ⚠️ Rules & Common Mistakes

| Mistake | Correct Approach |
|---|---|
| Using `process.env.X` directly in a controller | Always import from `config/env.js` |
| Forgetting `asyncHandler` wrapper on any controller | Every exported handler must be wrapped |
| Registering `errorHandler` before routes | Always register `notFound` + `errorHandler` LAST in `server.js` |
| Guessing column names in SQL | Read `schema.sql` before writing any query |
| Creating an Application with both `internship_id` and `job_id` set | The `chk_one_target` constraint enforces mutual exclusivity — always pass only one |
| Accepting/rejecting an offer without updating application status | When offer is accepted, also update `applications.status = 'accepted'` |
| Initiating onboarding before offer is accepted | Check `offers.status = 'accepted'` before creating an onboarding record |
| Using array index as React key | Use `item.application_id`, `item.interview_id`, etc. |
| Business logic inside `server.js` | `server.js` only: configure middleware, mount routes, register error handlers |
| Using Mongoose/MongoDB | **PostgreSQL + `pg` Pool ONLY.** No ORM. |

---

*Internship and Job Management System*  
*Full-Stack: React 18 · Vite · TailwindCSS · Node.js · Express · PostgreSQL (pg)*
