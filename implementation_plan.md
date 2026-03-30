# Implementation Plan: Major Feature Update (Final)

## Overview
19 consolidated requirements. All decisions settled except **website name** — proposing **"SmartNiyukti"** (clean, professional, placement-focused).

---

## Settled Decisions

| Decision | Choice |
|---|---|
| Education / Experience / Projects storage | **JSONB arrays** in Postgres |
| Icon library | **Lucide React** (replace all `react-icons/hi` usages) |
| GPA field | Renamed to **CGPA** (out of 10, decimal) |
| Date picker | Custom styled input with clear format label |
| Onboarding | **Removed entirely** (DB, backend, frontend) |
| Interview notes | **Kept and used** in scheduling form |
| offer_letter_url | **Used** — company can enter/upload URL when issuing offer |
| Application auto-delete | **PostgreSQL scheduled rule** via `pg_cron` or app-level batch job on fetch — will implement as a middleware that deletes stale records on GET calls |

---

## User Review Required

> [!IMPORTANT]
> **Website Name**: Proposing **"SmartNiyukti"** — approve or suggest alternative before I start.

> [!IMPORTANT]
> **JSONB Migration**: Existing `education`, `experience`, `projects` TEXT columns will be **converted to JSONB**. Any existing text data will be lost (only demo data exists currently, so this is safe). Confirm OK.

> [!WARNING]
> **Application auto-delete after 1 month**: Will implement as a DB-level check — when listing applications, any with `status = 'pending'` AND `apply_date < NOW() - INTERVAL '30 days'` will be auto-deleted in the query. This is simpler than a cron job and requires no extra infrastructure.

---

## Proposed Changes

### Phase 1 — Database (ALTER TABLE)
```sql
-- Students: new fields
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS github_url TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
  ADD COLUMN IF NOT EXISTS location VARCHAR(200),
  ALTER COLUMN gpa TYPE NUMERIC(4,2),  -- keep column name in DB, rename in app layer
  ALTER COLUMN education TYPE JSONB USING '[]'::jsonb,
  ALTER COLUMN experience TYPE JSONB USING '[]'::jsonb,
  ALTER COLUMN projects TYPE JSONB USING '[]'::jsonb;

-- Listings: deadline
ALTER TABLE internships ADD COLUMN IF NOT EXISTS deadline TIMESTAMP;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS deadline TIMESTAMP;

-- Drop onboarding table
DROP TABLE IF EXISTS onboarding CASCADE;
```

---

### Phase 2 — Backend Changes

#### [MODIFY] `students.controller.js`
- `getProfile` / `updateProfile`: add `linkedin_url`, `github_url`, `portfolio_url`, `location`
- `updateProfile`: accept JSONB arrays for `education`, `experiences`, `projects`

#### [MODIFY] `companies.controller.js`
- `getInternshipApplicants` / `getJobApplicants`: include full student fields for company view (education, experience, projects, skills, linkedin_url, github_url, portfolio_url, location, cgpa, resume_url)
- Add `GET /analytics` — company-scoped analytics endpoint

#### [MODIFY] `companies.routes.js`
- Add `GET /analytics`
- Add `GET /public/:id` — public company profile (no auth needed)

#### [MODIFY] `internships.controller.js` + `jobs.controller.js`
- `create` / `update`: accept `deadline` field
- Public `list`: **filter `WHERE deadline IS NULL OR deadline > NOW()`**
- Company `getInternships` / `getJobs`: returns all (including expired)

#### [MODIFY] `interviews.controller.js`
- `createInterview`: change auto-status to **`shortlisted`** (was `under_review`)
- Interview notes field: keep and require in scheduling form

#### [MODIFY] `offers.controller.js`
- `createOffer`: accept `offer_letter_url` (text URL — company pastes or provides link)
- Already auto-sets application to `offered` ✅

#### [MODIFY] `applications.controller.js`
- `getApplications` (student): add delete-before-fetch for 30-day stale pending apps

#### [MODIFY] `app.js`
- Remove onboarding route registration

#### [DELETE] `modules/onboarding/` (entire directory)

#### [NEW] `modules/companies/companies.controller.js` — add `getPublicProfile`

---

### Phase 3 — New Frontend Pages

#### [NEW] `pages/student/EditProfile.jsx`
Full page at `/student/profile/edit`:
- **Contact section**: name, phone, email (read-only), linkedin_url, github_url, portfolio_url, location
- **CGPA**: numeric input, 0–10
- **Education** (JSONB array, repeating form):
  - Degree, Institution, Year (from–to), Field of Study
  - "+ Add Education" / "Remove" buttons
- **Experiences** (JSONB array, repeating form):
  - Job Title, Company, Start–End, Description, is_current toggle, experience_years (auto-calc or manual)
- **Projects** (JSONB array, repeating form):
  - Name, Tech Stack, Description, URL
- **Skills** (tag/chip input)
- **Resume Upload** with AI parse (retains existing Gemini logic)

#### [NEW] `pages/company/ApplicantsPage.jsx`
Full page at `/company/listings/:type/:id/applicants`:
- **Status tabs**: All / Pending / Shortlisted / Offered / Rejected / Accepted
- Per applicant card:
  - Name, CGPA, Experience Years, Location
  - Contact: email, phone, linkedin, github, portfolio
  - Education, Experiences, Projects expandable section
  - Skills chips
  - **Download Resume** button (opens resume_url)
  - **Schedule Interview** accordion (date, mode, round, notes) → auto-sets status to `shortlisted`
  - **Issue Offer** accordion (deadline, offer_letter_url) → auto-sets status to `offered`

#### [NEW] `pages/company/PostListingPage.jsx`
Full page at `/company/post/internship` and `/company/post/job`:
- Clean form with deadline picker:
  - Custom clear date UI with visual calendar-style input
  - Shows "Applications close on [date]" preview text
  - Clear label: "Deadline (last day to apply)"

#### [NEW] `pages/company/CompanyAnalytics.jsx`
At `/company/analytics`:
- Total applicants, shortlisted, offered, accepted (KPI cards)
- Bar chart: applications per listing
- Pie: status distribution (own apps only)

#### [NEW] `pages/company/CompanyProfile.jsx` (public-facing)
At `/companies/:id`:
- Shows company name, industry, location, website
- Lists active internships and jobs from this company

---

### Phase 4 — Modified Frontend Pages

#### [MODIFY] `pages/student/StudentDashboard.jsx`
- Stats cards → clickable, navigate to `/student/applications?status=pending`, `?status=shortlisted`, etc.
- "Edit Profile" button → `Link` to `/student/profile/edit` (remove modal)

#### [MODIFY] `pages/student/MyApplications.jsx`
- Read `?status=` query param → pre-filter tab on load

#### [MODIFY] `pages/student/InternshipDetail.jsx` + `JobDetail.jsx`
- Fetch student's applied listing IDs on mount
- If already applied → disable button, show "Already Applied" badge

#### [MODIFY] `pages/company/CompanyDashboard.jsx`
- "Post Internship" / "Post Job" → navigate to `PostListingPage`
- "Applicants" → navigate to `ApplicantsPage`
- Add "Analytics" card

#### [MODIFY] `pages/coordinator/AnalyticsDashboard.jsx`
**Fix chart bugs** shown in screenshot:
- **Status Distribution Pie**: was mislabeling data — verify field names from API match `pending`, `accepted`, `rejected`, `offered`
- **Offer Outcomes Bar**: Each bar needs individual `fill` via `Cell` component with explicit index. Also add `shortlisted` count to status distribution

#### [MODIFY] `pages/student/ApplicationDetail.jsx`
- Remove onboarding section entirely
- Show offer_letter_url as a download link if present

#### [MODIFY] `App.jsx`
New routes:
- `/student/profile/edit`
- `/company/listings/:type/:id/applicants`
- `/company/post/:type`
- `/company/analytics`
- `/companies/:id` (public)

#### [MODIFY] `components/layout/Navbar.jsx`
- Rename brand: "InternPlace" → **"SmartNiyukti"** (or chosen name)
- Company nav: add "Analytics" link
- Header: Company name links to `/companies/:id`

#### [MODIFY] `pages/LandingPage.jsx`
- Replace brand name and emoji references with Lucide icons
- Update hero copy to match new brand

#### [MODIFY] `utils/api.js`
- Add `companyAPI.getAnalytics()`
- Add `companyAPI.getPublicProfile(id)`
- Add `studentAPI.getAppliedListingIds()` → returns `{ internship_ids: [], job_ids: [] }`
- Update `companyAPI`: remove `scheduleInterview` / `issueOffer` (use direct routes)

---

### Phase 5 — Icon Library Migration
Replace all `react-icons/hi` (HiOutline*) imports with `lucide-react`:

| Old | New |
|---|---|
| `HiOutlineBriefcase` | `Briefcase` |
| `HiOutlineDocumentText` | `FileText` |
| `HiOutlineStar` | `Star` |
| `HiOutlineUsers` | `Users` |
| `HiOutlinePencil` | `Pencil` |
| `HiOutlineX` | `X` |
| etc. | etc. |

---

### Phase 6 — Demo Data (Seed SQL)

New seed file `backend/src/seed.sql`:
- 3 coordinators
- 8 students (with education/experience/projects JSONB, varied skills, cgpa, linkedin)
- 5 companies (different industries)
- 6 internships (varied deadlines, stipends, required experience)
- 4 jobs (varied deadlines, salaries)
- 15 applications (spread across statuses)
- 5 interviews (with notes)
- 3 offers (2 pending, 1 accepted with offer_letter_url)

---

## Files to Delete
- `backend/src/modules/onboarding/` (all files)
- `frontend/src/components/shared/ApplicantsPanel.jsx` (replaced by page)
- `frontend/src/components/shared/EditProfileModal.jsx` (replaced by page)

## Open Questions

> [!IMPORTANT]
> **Website name**: "SmartNiyukti" — approve or provide alternative.

> [!NOTE]
> **Lucide React**: already in `package.json` as a dependency (`lucide-react`)? Will check and install if needed.
