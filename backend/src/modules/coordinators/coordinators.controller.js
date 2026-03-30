import asyncHandler from "../../shared/utils/asyncHandler.js";
import { ApiResponse, ApiError } from "../../shared/utils/apiResponse.js";
import pool from "../../config/db.js";

// ─── Get students under this coordinator ─────────────────────────────
export const getStudents = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT student_id, name, email, phone, cgpa, skills, resume_url, created_at
     FROM students WHERE coordinator_id = $1
     ORDER BY name ASC`,
    [req.user.id]
  );
  return res.json(new ApiResponse(200, rows, "Students fetched"));
});

// ─── Get single student ──────────────────────────────────────────────
export const getStudent = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT student_id, name, email, phone, cgpa, skills, resume_url, created_at
     FROM students WHERE student_id = $1 AND coordinator_id = $2`,
    [req.params.id, req.user.id]
  );
  if (rows.length === 0) throw new ApiError(404, "Student not found");
  return res.json(new ApiResponse(200, rows[0], "Student fetched"));
});

// ─── Update student ──────────────────────────────────────────────────
export const updateStudent = asyncHandler(async (req, res) => {
  const { name, phone, cgpa, skills } = req.body;

  const { rows } = await pool.query(
    `UPDATE students
     SET name = COALESCE($1, name),
         phone = COALESCE($2, phone),
         cgpa = COALESCE($3, cgpa),
         skills = COALESCE($4, skills),
         updated_at = NOW()
     WHERE student_id = $5 AND coordinator_id = $6
     RETURNING student_id, name, email, phone, cgpa, skills`,
    [name || null, phone || null, cgpa || null, skills || null, req.params.id, req.user.id]
  );

  if (rows.length === 0) throw new ApiError(404, "Student not found");
  return res.json(new ApiResponse(200, rows[0], "Student updated"));
});

// ─── Delete student ──────────────────────────────────────────────────
export const deleteStudent = asyncHandler(async (req, res) => {
  const { rowCount } = await pool.query(
    `DELETE FROM students WHERE student_id = $1 AND coordinator_id = $2`,
    [req.params.id, req.user.id]
  );
  if (rowCount === 0) throw new ApiError(404, "Student not found");
  return res.json(new ApiResponse(200, null, "Student removed"));
});

// ─── Get companies under this coordinator ────────────────────────────
export const getCompanies = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT company_id, name, industry, location, contact_email, website, created_at
     FROM companies WHERE coordinator_id = $1
     ORDER BY name ASC`,
    [req.user.id]
  );
  return res.json(new ApiResponse(200, rows, "Companies fetched"));
});

// ─── Get single company ─────────────────────────────────────────────
export const getCompany = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT company_id, name, industry, location, contact_email, website, created_at
     FROM companies WHERE company_id = $1 AND coordinator_id = $2`,
    [req.params.id, req.user.id]
  );
  if (rows.length === 0) throw new ApiError(404, "Company not found");
  return res.json(new ApiResponse(200, rows[0], "Company fetched"));
});

// ─── Get all applications under coordinator's students ───────────────
export const getApplications = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT a.*, s.name AS student_name, s.email AS student_email,
            i.title AS internship_title, j.job_title,
            c.name AS company_name
     FROM applications a
     JOIN students s ON a.student_id = s.student_id
     LEFT JOIN internships i ON a.internship_id = i.internship_id
     LEFT JOIN jobs j ON a.job_id = j.job_id
     LEFT JOIN companies c ON COALESCE(i.company_id, j.company_id) = c.company_id
     WHERE s.coordinator_id = $1
     ORDER BY a.apply_date DESC`,
    [req.user.id]
  );
  return res.json(new ApiResponse(200, rows, "Applications fetched"));
});

// ─── Get single application with lifecycle ───────────────────────────
export const getApplicationDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const app = await pool.query(
    `SELECT a.*, s.name AS student_name,
            i.title AS internship_title, j.job_title,
            c.name AS company_name
     FROM applications a
     JOIN students s ON a.student_id = s.student_id
     LEFT JOIN internships i ON a.internship_id = i.internship_id
     LEFT JOIN jobs j ON a.job_id = j.job_id
     LEFT JOIN companies c ON COALESCE(i.company_id, j.company_id) = c.company_id
     WHERE a.application_id = $1 AND s.coordinator_id = $2`,
    [id, req.user.id]
  );
  if (app.rows.length === 0) throw new ApiError(404, "Application not found");

  const interviews = await pool.query(
    `SELECT * FROM interviews WHERE application_id = $1 ORDER BY date ASC`, [id]
  );
  const offers = await pool.query(
    `SELECT * FROM offers WHERE application_id = $1`, [id]
  );

  let onboarding = null;
  if (offers.rows.length > 0) {
    const onb = await pool.query(
      `SELECT * FROM onboarding WHERE offer_id = $1`, [offers.rows[0].offer_id]
    );
    onboarding = onb.rows[0] || null;
  }

  return res.json(new ApiResponse(200, {
    application: app.rows[0],
    interviews: interviews.rows,
    offer: offers.rows[0] || null,
    onboarding,
  }, "Application detail fetched"));
});

// ─── Update application status ───────────────────────────────────────
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) throw new ApiError(400, "Status is required");

  // Verify the application belongs to one of this coordinator's students
  const app = await pool.query(
    `SELECT a.application_id FROM applications a
     JOIN students s ON a.student_id = s.student_id
     WHERE a.application_id = $1 AND s.coordinator_id = $2`,
    [req.params.id, req.user.id]
  );
  if (app.rows.length === 0) throw new ApiError(404, "Application not found");

  const { rows } = await pool.query(
    `UPDATE applications SET status = $1 WHERE application_id = $2 RETURNING application_id, status`,
    [status, req.params.id]
  );

  return res.json(new ApiResponse(200, rows[0], "Application status updated"));
});

// ─── Reports summary ────────────────────────────────────────────────
export const getReportsSummary = asyncHandler(async (req, res) => {
  const coordId = req.user.id;

  const studentCount = await pool.query(
    `SELECT COUNT(*) AS total FROM students WHERE coordinator_id = $1`, [coordId]
  );

  const companyCount = await pool.query(
    `SELECT COUNT(*) AS total FROM companies WHERE coordinator_id = $1`, [coordId]
  );

  const appStats = await pool.query(
    `SELECT
       COUNT(*) AS total_applications,
       COUNT(*) FILTER (WHERE a.status = 'accepted') AS accepted,
       COUNT(*) FILTER (WHERE a.status = 'rejected') AS rejected,
       COUNT(*) FILTER (WHERE a.status = 'offered') AS offered,
       COUNT(*) FILTER (WHERE a.status = 'pending') AS pending,
       COUNT(*) FILTER (WHERE a.application_type = 'internship') AS internship_apps,
       COUNT(*) FILTER (WHERE a.application_type = 'job') AS job_apps
     FROM applications a
     JOIN students s ON a.student_id = s.student_id
     WHERE s.coordinator_id = $1`,
    [coordId]
  );

  const offerStats = await pool.query(
    `SELECT
       COUNT(*) AS total_offers,
       COUNT(*) FILTER (WHERE o.status = 'accepted') AS offers_accepted,
       COUNT(*) FILTER (WHERE o.status = 'rejected') AS offers_rejected
     FROM offers o
     JOIN applications a ON o.application_id = a.application_id
     JOIN students s ON a.student_id = s.student_id
     WHERE s.coordinator_id = $1`,
    [coordId]
  );

  return res.json(new ApiResponse(200, {
    total_students: studentCount.rows[0].total,
    total_companies: companyCount.rows[0].total,
    ...appStats.rows[0],
    ...offerStats.rows[0],
  }, "Reports summary fetched"));
});
