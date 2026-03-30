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

// ─── Get applicants for an internship ────────────────────────────────
export const getInternshipApplicants = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify this internship belongs to the company
  const internship = await pool.query(
    `SELECT internship_id FROM internships WHERE internship_id = $1 AND company_id = $2`,
    [id, req.user.id]
  );
  if (internship.rows.length === 0) throw new ApiError(404, "Internship not found or not yours");

  const { rows } = await pool.query(
    `SELECT a.application_id, a.status, a.apply_date,
            s.student_id, s.name, s.email, s.phone, s.gpa, s.skills, s.resume_url
     FROM applications a
     JOIN students s ON a.student_id = s.student_id
     WHERE a.internship_id = $1
     ORDER BY a.apply_date DESC`,
    [id]
  );
  return res.json(new ApiResponse(200, rows, "Applicants fetched"));
});

// ─── Get applicants for a job ────────────────────────────────────────
export const getJobApplicants = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const job = await pool.query(
    `SELECT job_id FROM jobs WHERE job_id = $1 AND company_id = $2`,
    [id, req.user.id]
  );
  if (job.rows.length === 0) throw new ApiError(404, "Job not found or not yours");

  const { rows } = await pool.query(
    `SELECT a.application_id, a.status, a.apply_date,
            s.student_id, s.name, s.email, s.phone, s.gpa, s.skills, s.resume_url
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

  // Verify the application belongs to one of this company's internships/jobs
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
