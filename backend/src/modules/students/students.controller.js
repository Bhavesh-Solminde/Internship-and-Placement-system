import asyncHandler from "../../shared/utils/asyncHandler.js";
import { ApiResponse, ApiError } from "../../shared/utils/apiResponse.js";
import pool from "../../config/db.js";
import { parseResumeWithAI } from "../../shared/utils/resumeParser.js";
import path from "path";
import fs from "fs";

// ─── Get own profile ─────────────────────────────────────────────────
export const getProfile = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT student_id, name, email, phone, cgpa, skills, resume_url,
            education, experience, projects, experience_years,
            linkedin_url, github_url, portfolio_url, location,
            coordinator_id, created_at, updated_at
     FROM students WHERE student_id = $1`,
    [req.user.id]
  );
  if (rows.length === 0) throw new ApiError(404, "Student not found");
  return res.json(new ApiResponse(200, rows[0], "Profile fetched"));
});

// ─── Update profile ──────────────────────────────────────────────────
export const updateProfile = asyncHandler(async (req, res) => {
  const {
    name, phone, cgpa, skills, education, experience, projects,
    experience_years, linkedin_url, github_url, portfolio_url, location,
  } = req.body;

  const { rows } = await pool.query(
    `UPDATE students
     SET name = COALESCE($1, name),
         phone = COALESCE($2, phone),
         cgpa = COALESCE($3, cgpa),
         skills = COALESCE($4, skills),
         education = COALESCE($5, education),
         experience = COALESCE($6, experience),
         projects = COALESCE($7, projects),
         experience_years = COALESCE($8, experience_years),
         linkedin_url = COALESCE($9, linkedin_url),
         github_url = COALESCE($10, github_url),
         portfolio_url = COALESCE($11, portfolio_url),
         location = COALESCE($12, location),
         updated_at = NOW()
     WHERE student_id = $13
     RETURNING student_id, name, email, phone, cgpa, skills, resume_url,
              education, experience, projects, experience_years,
              linkedin_url, github_url, portfolio_url, location, updated_at`,
    [
      name || null, phone || null, cgpa != null ? cgpa : null, skills || null,
      education ? JSON.stringify(education) : null,
      experience ? JSON.stringify(experience) : null,
      projects ? JSON.stringify(projects) : null,
      experience_years != null ? experience_years : null,
      linkedin_url || null, github_url || null, portfolio_url || null, location || null,
      req.user.id,
    ]
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

// ─── Parse resume with AI ────────────────────────────────────────────
export const parseResume = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded. Please select a PDF file.");

  const ext = path.extname(req.file.originalname).toLowerCase();
  if (ext !== ".pdf") {
    // Clean up non-PDF file
    try { fs.unlinkSync(req.file.path); } catch (_) { /* ignore */ }
    throw new ApiError(400, "Only PDF files are supported for resume parsing.");
  }

  const resumeUrl = `/uploads/${req.file.filename}`;
  const filePath = path.resolve(req.file.path);

  // Save the resume URL regardless of parse outcome
  await pool.query(
    `UPDATE students SET resume_url = $1, updated_at = NOW() WHERE student_id = $2`,
    [resumeUrl, req.user.id]
  );

  let parsed = null;
  try {
    parsed = await parseResumeWithAI(filePath);
  } catch (parseError) {
    console.error("[Resume Parse Failure]", parseError.message);
    // Return 422 with the specific error message so the frontend can show it
    throw new ApiError(422, parseError.message || "Resume parsing failed. Please try again.");
  }

  return res.json(new ApiResponse(200, { resume_url: resumeUrl, parsed }, "Resume parsed successfully"));
});

// ─── Get own applications ────────────────────────────────────────────
export const getApplications = asyncHandler(async (req, res) => {
  // Auto-delete stale pending applications older than 30 days
  await pool.query(
    `DELETE FROM applications
     WHERE student_id = $1 AND status = 'pending'
       AND apply_date < NOW() - INTERVAL '30 days'`,
    [req.user.id]
  );

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

  const interviews = await pool.query(
    `SELECT * FROM interviews WHERE application_id = $1 ORDER BY date ASC`, [id]
  );
  const offers = await pool.query(
    `SELECT * FROM offers WHERE application_id = $1`, [id]
  );

  return res.json(new ApiResponse(200, {
    application: appResult.rows[0],
    interviews: interviews.rows,
    offer: offers.rows[0] || null,
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

// ─── Get IDs of listings the student already applied to ──────────────
export const getAppliedIds = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT internship_id, job_id FROM applications WHERE student_id = $1`,
    [req.user.id]
  );
  const internship_ids = rows.filter(r => r.internship_id).map(r => r.internship_id);
  const job_ids = rows.filter(r => r.job_id).map(r => r.job_id);
  return res.json(new ApiResponse(200, { internship_ids, job_ids }, "Applied IDs fetched"));
});

// ─── Skills & Experience Matching Engine ─────────────────────────────
export const getMatches = asyncHandler(async (req, res) => {
  const studentResult = await pool.query(
    `SELECT skills, experience_years FROM students WHERE student_id = $1`,
    [req.user.id]
  );
  if (studentResult.rows.length === 0) throw new ApiError(404, "Student not found");

  const student = studentResult.rows[0];
  const studentSkills = (student.skills || []).map((s) => s.toLowerCase().trim());
  const studentExp = Number(student.experience_years) || 0;

  if (studentSkills.length === 0) {
    return res.json(new ApiResponse(200, { internships: [], jobs: [] }, "Add skills to get recommendations"));
  }

  const internshipsResult = await pool.query(
    `SELECT i.*, c.name AS company_name, c.industry, c.location AS company_location
     FROM internships i
     JOIN companies c ON i.company_id = c.company_id
     WHERE i.status = 'open' AND (i.deadline IS NULL OR i.deadline > NOW())
     ORDER BY i.created_at DESC`
  );
  const jobsResult = await pool.query(
    `SELECT j.*, c.name AS company_name, c.industry, c.location AS company_location
     FROM jobs j
     JOIN companies c ON j.company_id = c.company_id
     WHERE j.status = 'open' AND (j.deadline IS NULL OR j.deadline > NOW())
     ORDER BY j.created_at DESC`
  );

  const scoreAndFilter = (listings, titleKey) => {
    return listings
      .filter((item) => {
        const reqExp = Number(item.required_experience_years) || 0;
        return studentExp >= reqExp;
      })
      .map((item) => {
        const text = `${item[titleKey] || ""} ${item.description || ""}`.toLowerCase();
        const matchedSkills = studentSkills.filter((skill) => text.includes(skill));
        const score = Math.round((matchedSkills.length / studentSkills.length) * 100);
        return { ...item, match_score: score, matched_skills: matchedSkills };
      })
      .filter((item) => item.match_score > 0)
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 10);
  };

  return res.json(new ApiResponse(200, {
    internships: scoreAndFilter(internshipsResult.rows, "title"),
    jobs: scoreAndFilter(jobsResult.rows, "job_title"),
  }, "Match results fetched"));
});
