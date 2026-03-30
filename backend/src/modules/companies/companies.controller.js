import asyncHandler from "../../shared/utils/asyncHandler.js";
import { ApiResponse, ApiError } from "../../shared/utils/apiResponse.js";
import pool from "../../config/db.js";

// ─── Get own company profile ─────────────────────────────────────────
export const getProfile = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT company_id, name, industry, location, contact_email, website, coordinator_id, created_at
     FROM companies WHERE company_id = $1`,
    [req.user.id]
  );
  if (rows.length === 0) throw new ApiError(404, "Company not found");
  return res.json(new ApiResponse(200, rows[0], "Company profile fetched"));
});

// ─── Public company profile ──────────────────────────────────────────
export const getPublicProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const company = await pool.query(
    `SELECT company_id, name, industry, location, contact_email, website, created_at
     FROM companies WHERE company_id = $1`,
    [id]
  );
  if (company.rows.length === 0) throw new ApiError(404, "Company not found");

  const internships = await pool.query(
    `SELECT internship_id, title, stipend, duration, description, required_experience_years, deadline, status, created_at
     FROM internships WHERE company_id = $1 AND status = 'open' AND (deadline IS NULL OR deadline > NOW())
     ORDER BY created_at DESC`,
    [id]
  );
  const jobs = await pool.query(
    `SELECT job_id, job_title, salary, location, description, required_experience_years, deadline, status, created_at
     FROM jobs WHERE company_id = $1 AND status = 'open' AND (deadline IS NULL OR deadline > NOW())
     ORDER BY created_at DESC`,
    [id]
  );

  return res.json(new ApiResponse(200, {
    ...company.rows[0],
    internships: internships.rows,
    jobs: jobs.rows,
  }, "Public company profile fetched"));
});

// ─── Update company profile ──────────────────────────────────────────
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, industry, location, website } = req.body;
  const { rows } = await pool.query(
    `UPDATE companies
     SET name = COALESCE($1, name),
         industry = COALESCE($2, industry),
         location = COALESCE($3, location),
         website = COALESCE($4, website)
     WHERE company_id = $5
     RETURNING company_id, name, industry, location, contact_email, website`,
    [name || null, industry || null, location || null, website || null, req.user.id]
  );
  if (rows.length === 0) throw new ApiError(404, "Company not found");
  return res.json(new ApiResponse(200, rows[0], "Company profile updated"));
});

// ─── Get own internship listings ─────────────────────────────────────
export const getInternships = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM internships WHERE company_id = $1 ORDER BY created_at DESC`,
    [req.user.id]
  );
  return res.json(new ApiResponse(200, rows, "Internships fetched"));
});

// ─── Get own job listings ────────────────────────────────────────────
export const getJobs = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM jobs WHERE company_id = $1 ORDER BY created_at DESC`,
    [req.user.id]
  );
  return res.json(new ApiResponse(200, rows, "Jobs fetched"));
});

// ─── Get applicants for an internship (full profile) ─────────────────
export const getInternshipApplicants = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const internship = await pool.query(
    `SELECT internship_id FROM internships WHERE internship_id = $1 AND company_id = $2`,
    [id, req.user.id]
  );
  if (internship.rows.length === 0) throw new ApiError(404, "Internship not found or not yours");

  const { rows } = await pool.query(
    `SELECT a.application_id, a.status, a.apply_date,
            s.student_id, s.name, s.email, s.phone, s.cgpa, s.skills, s.resume_url,
            s.education, s.experience, s.projects, s.experience_years,
            s.linkedin_url, s.github_url, s.portfolio_url, s.location AS student_location
     FROM applications a
     JOIN students s ON a.student_id = s.student_id
     WHERE a.internship_id = $1
     ORDER BY a.apply_date DESC`,
    [id]
  );
  return res.json(new ApiResponse(200, rows, "Applicants fetched"));
});

// ─── Get applicants for a job (full profile) ─────────────────────────
export const getJobApplicants = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const job = await pool.query(
    `SELECT job_id FROM jobs WHERE job_id = $1 AND company_id = $2`,
    [id, req.user.id]
  );
  if (job.rows.length === 0) throw new ApiError(404, "Job not found or not yours");

  const { rows } = await pool.query(
    `SELECT a.application_id, a.status, a.apply_date,
            s.student_id, s.name, s.email, s.phone, s.cgpa, s.skills, s.resume_url,
            s.education, s.experience, s.projects, s.experience_years,
            s.linkedin_url, s.github_url, s.portfolio_url, s.location AS student_location
     FROM applications a
     JOIN students s ON a.student_id = s.student_id
     WHERE a.job_id = $1
     ORDER BY a.apply_date DESC`,
    [id]
  );
  return res.json(new ApiResponse(200, rows, "Applicants fetched"));
});

// ─── Update application status ───────────────────────────────────────
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { appId } = req.params;
  const { status } = req.body;
  if (!status) throw new ApiError(400, "Status is required");

  const app = await pool.query(
    `SELECT a.application_id FROM applications a
     LEFT JOIN internships i ON a.internship_id = i.internship_id
     LEFT JOIN jobs j ON a.job_id = j.job_id
     WHERE a.application_id = $1
       AND (i.company_id = $2 OR j.company_id = $2)`,
    [appId, req.user.id]
  );
  if (app.rows.length === 0) throw new ApiError(404, "Application not found or not authorized");

  const { rows } = await pool.query(
    `UPDATE applications SET status = $1 WHERE application_id = $2
     RETURNING application_id, status`,
    [status, appId]
  );
  return res.json(new ApiResponse(200, rows[0], "Application status updated"));
});

// ─── Company-specific analytics ──────────────────────────────────────
export const getAnalytics = asyncHandler(async (req, res) => {
  const companyId = req.user.id;

  const appStats = await pool.query(
    `SELECT
       COUNT(*) AS total_applicants,
       COUNT(*) FILTER (WHERE a.status = 'pending') AS pending,
       COUNT(*) FILTER (WHERE a.status = 'shortlisted') AS shortlisted,
       COUNT(*) FILTER (WHERE a.status = 'offered') AS offered,
       COUNT(*) FILTER (WHERE a.status = 'accepted') AS accepted,
       COUNT(*) FILTER (WHERE a.status = 'rejected') AS rejected,
       COUNT(*) FILTER (WHERE a.application_type = 'internship') AS internship_apps,
       COUNT(*) FILTER (WHERE a.application_type = 'job') AS job_apps
     FROM applications a
     LEFT JOIN internships i ON a.internship_id = i.internship_id
     LEFT JOIN jobs j ON a.job_id = j.job_id
     WHERE i.company_id = $1 OR j.company_id = $1`,
    [companyId]
  );

  const offerStats = await pool.query(
    `SELECT
       COUNT(*) AS total_offers,
       COUNT(*) FILTER (WHERE o.status = 'accepted') AS offers_accepted,
       COUNT(*) FILTER (WHERE o.status = 'rejected') AS offers_rejected,
       COUNT(*) FILTER (WHERE o.status = 'pending') AS offers_pending
     FROM offers o
     JOIN applications a ON o.application_id = a.application_id
     LEFT JOIN internships i ON a.internship_id = i.internship_id
     LEFT JOIN jobs j ON a.job_id = j.job_id
     WHERE i.company_id = $1 OR j.company_id = $1`,
    [companyId]
  );

  const listingStats = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM internships WHERE company_id = $1) AS total_internships,
       (SELECT COUNT(*) FROM jobs WHERE company_id = $1) AS total_jobs`,
    [companyId]
  );

  // Per-listing breakdown
  const perListing = await pool.query(
    `SELECT title AS listing_title, 'internship' AS type, COUNT(a.application_id) AS app_count
     FROM internships i
     LEFT JOIN applications a ON a.internship_id = i.internship_id
     WHERE i.company_id = $1 GROUP BY i.internship_id, title
     UNION ALL
     SELECT job_title AS listing_title, 'job' AS type, COUNT(a.application_id) AS app_count
     FROM jobs j
     LEFT JOIN applications a ON a.job_id = j.job_id
     WHERE j.company_id = $1 GROUP BY j.job_id, job_title
     ORDER BY app_count DESC`,
    [companyId]
  );

  return res.json(new ApiResponse(200, {
    ...appStats.rows[0],
    ...offerStats.rows[0],
    ...listingStats.rows[0],
    per_listing: perListing.rows,
  }, "Company analytics fetched"));
});
