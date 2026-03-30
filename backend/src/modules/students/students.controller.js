import asyncHandler from "../../shared/utils/asyncHandler.js";
import { ApiResponse, ApiError } from "../../shared/utils/apiResponse.js";
import pool from "../../config/db.js";

// ─── Get own profile ─────────────────────────────────────────────────
export const getProfile = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT student_id, name, email, phone, gpa, skills, resume_url, coordinator_id, created_at, updated_at
     FROM students WHERE student_id = $1`,
    [req.user.id]
  );
  if (rows.length === 0) throw new ApiError(404, "Student not found");
  return res.json(new ApiResponse(200, rows[0], "Profile fetched"));
});

// ─── Update profile ──────────────────────────────────────────────────
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, gpa, skills } = req.body;

  const { rows } = await pool.query(
    `UPDATE students
     SET name = COALESCE($1, name),
         phone = COALESCE($2, phone),
         gpa = COALESCE($3, gpa),
         skills = COALESCE($4, skills),
         updated_at = NOW()
     WHERE student_id = $5
     RETURNING student_id, name, email, phone, gpa, skills, resume_url, updated_at`,
    [name || null, phone || null, gpa || null, skills || null, req.user.id]
  );

  if (rows.length === 0) throw new ApiError(404, "Student not found");
  return res.json(new ApiResponse(200, rows[0], "Profile updated"));
});

// ─── Upload resume ───────────────────────────────────────────────────
export const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded");

  const resumeUrl = `/uploads/${req.file.filename}`;

  const { rows } = await pool.query(
    `UPDATE students SET resume_url = $1, updated_at = NOW()
     WHERE student_id = $2
     RETURNING student_id, resume_url`,
    [resumeUrl, req.user.id]
  );

  return res.json(new ApiResponse(200, rows[0], "Resume uploaded"));
});

// ─── Get own applications ────────────────────────────────────────────
export const getApplications = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT a.application_id, a.apply_date, a.status, a.application_type,
            i.title AS internship_title, i.stipend,
            j.job_title, j.salary,
            c.name AS company_name
     FROM applications a
     LEFT JOIN internships i ON a.internship_id = i.internship_id
     LEFT JOIN jobs j ON a.job_id = j.job_id
     LEFT JOIN companies c ON COALESCE(i.company_id, j.company_id) = c.company_id
     WHERE a.student_id = $1
     ORDER BY a.apply_date DESC`,
    [req.user.id]
  );
  return res.json(new ApiResponse(200, rows, "Applications fetched"));
});

// ─── Get single application with full lifecycle ──────────────────────
export const getApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Application
  const appResult = await pool.query(
    `SELECT a.*, i.title AS internship_title, i.stipend, i.duration,
            j.job_title, j.salary, j.location AS job_location,
            c.name AS company_name, c.industry
     FROM applications a
     LEFT JOIN internships i ON a.internship_id = i.internship_id
     LEFT JOIN jobs j ON a.job_id = j.job_id
     LEFT JOIN companies c ON COALESCE(i.company_id, j.company_id) = c.company_id
     WHERE a.application_id = $1 AND a.student_id = $2`,
    [id, req.user.id]
  );

  if (appResult.rows.length === 0) throw new ApiError(404, "Application not found");

  // Interviews
  const interviews = await pool.query(
    `SELECT * FROM interviews WHERE application_id = $1 ORDER BY date ASC`,
    [id]
  );

  // Offer
  const offers = await pool.query(
    `SELECT * FROM offers WHERE application_id = $1`,
    [id]
  );

  // Onboarding (if offer exists)
  let onboarding = null;
  if (offers.rows.length > 0) {
    const onb = await pool.query(
      `SELECT * FROM onboarding WHERE offer_id = $1`,
      [offers.rows[0].offer_id]
    );
    onboarding = onb.rows[0] || null;
  }

  return res.json(new ApiResponse(200, {
    application: appResult.rows[0],
    interviews: interviews.rows,
    offer: offers.rows[0] || null,
    onboarding,
  }, "Application details fetched"));
});

// ─── Dashboard stats ─────────────────────────────────────────────────
export const getDashboard = asyncHandler(async (req, res) => {
  const id = req.user.id;

  const stats = await pool.query(
    `SELECT
       COUNT(*) FILTER (WHERE TRUE) AS total_applied,
       COUNT(*) FILTER (WHERE status = 'shortlisted') AS shortlisted,
       COUNT(*) FILTER (WHERE status = 'offered') AS offered,
       COUNT(*) FILTER (WHERE status = 'accepted') AS accepted,
       COUNT(*) FILTER (WHERE status = 'rejected') AS rejected
     FROM applications WHERE student_id = $1`,
    [id]
  );

  const interviewCount = await pool.query(
    `SELECT COUNT(*) AS total_interviews
     FROM interviews iv
     JOIN applications a ON iv.application_id = a.application_id
     WHERE a.student_id = $1`,
    [id]
  );

  return res.json(new ApiResponse(200, {
    ...stats.rows[0],
    total_interviews: interviewCount.rows[0].total_interviews,
  }, "Dashboard stats fetched"));
});
