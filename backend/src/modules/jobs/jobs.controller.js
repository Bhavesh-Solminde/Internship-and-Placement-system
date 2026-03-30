import asyncHandler from "../../shared/utils/asyncHandler.js";
import { ApiResponse, ApiError } from "../../shared/utils/apiResponse.js";
import pool from "../../config/db.js";

// ─── Browse jobs (public) ────────────────────────────────────────────
export const listJobs = asyncHandler(async (req, res) => {
  const { company, location, status, search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (company) { conditions.push(`c.name ILIKE $${idx++}`); params.push(`%${company}%`); }
  if (location) { conditions.push(`j.location ILIKE $${idx++}`); params.push(`%${location}%`); }
  if (status) { conditions.push(`j.status = $${idx++}`); params.push(status); }
  if (search) { conditions.push(`(j.job_title ILIKE $${idx} OR j.description ILIKE $${idx})`); params.push(`%${search}%`); idx++; }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  params.push(limit, offset);
  const { rows } = await pool.query(
    `SELECT j.*, c.name AS company_name, c.industry, c.location AS company_location
     FROM jobs j
     JOIN companies c ON j.company_id = c.company_id
     ${where}
     ORDER BY j.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    params
  );

  return res.json(new ApiResponse(200, rows, "Jobs fetched"));
});

// ─── Get single job (public) ─────────────────────────────────────────
export const getJob = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT j.*, c.name AS company_name, c.industry, c.location AS company_location, c.website
     FROM jobs j
     JOIN companies c ON j.company_id = c.company_id
     WHERE j.job_id = $1`,
    [req.params.id]
  );
  if (rows.length === 0) throw new ApiError(404, "Job not found");
  return res.json(new ApiResponse(200, rows[0], "Job detail fetched"));
});

// ─── Create job (company) ────────────────────────────────────────────
export const createJob = asyncHandler(async (req, res) => {
  const { job_title, salary, location, description } = req.body;
  if (!job_title) throw new ApiError(400, "Job title is required");

  const { rows } = await pool.query(
    `INSERT INTO jobs (job_title, salary, location, description, company_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [job_title, salary || null, location || null, description || null, req.user.id]
  );

  return res.status(201).json(new ApiResponse(201, rows[0], "Job created"));
});

// ─── Update job (company) ────────────────────────────────────────────
export const updateJob = asyncHandler(async (req, res) => {
  const { job_title, salary, location, description, status } = req.body;

  const { rows } = await pool.query(
    `UPDATE jobs
     SET job_title = COALESCE($1, job_title),
         salary = COALESCE($2, salary),
         location = COALESCE($3, location),
         description = COALESCE($4, description),
         status = COALESCE($5, status)
     WHERE job_id = $6 AND company_id = $7
     RETURNING *`,
    [job_title || null, salary || null, location || null, description || null, status || null, req.params.id, req.user.id]
  );

  if (rows.length === 0) throw new ApiError(404, "Job not found or not yours");
  return res.json(new ApiResponse(200, rows[0], "Job updated"));
});

// ─── Delete job (company) ────────────────────────────────────────────
export const deleteJob = asyncHandler(async (req, res) => {
  const { rowCount } = await pool.query(
    `DELETE FROM jobs WHERE job_id = $1 AND company_id = $2`,
    [req.params.id, req.user.id]
  );
  if (rowCount === 0) throw new ApiError(404, "Job not found or not yours");
  return res.json(new ApiResponse(200, null, "Job deleted"));
});

// ─── Apply to job (student) ──────────────────────────────────────────
export const applyToJob = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const job = await pool.query(
    `SELECT status FROM jobs WHERE job_id = $1`,
    [id]
  );
  if (job.rows.length === 0) throw new ApiError(404, "Job not found");
  if (job.rows[0].status !== "open") throw new ApiError(400, "Job is not open for applications");

  const { rows } = await pool.query(
    `INSERT INTO applications (student_id, job_id, application_type)
     VALUES ($1, $2, 'job')
     RETURNING *`,
    [req.user.id, id]
  );

  return res.status(201).json(new ApiResponse(201, rows[0], "Applied to job"));
});
