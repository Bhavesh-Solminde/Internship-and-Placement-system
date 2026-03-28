import asyncHandler from "../../shared/utils/asyncHandler.js";
import { ApiResponse, ApiError } from "../../shared/utils/apiResponse.js";
import pool from "../../config/db.js";

// ─── Browse internships (public) ─────────────────────────────────────
export const listInternships = asyncHandler(async (req, res) => {
  const { company, location, status, search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  const conditions = [];
  const params = [];
  let idx = 1;

  if (company) { conditions.push(`c.name ILIKE $${idx++}`); params.push(`%${company}%`); }
  if (location) { conditions.push(`i.location ILIKE $${idx++}`); params.push(`%${location}%`); }
  if (status) { conditions.push(`i.status = $${idx++}`); params.push(status); }
  if (search) { conditions.push(`(i.title ILIKE $${idx} OR i.description ILIKE $${idx})`); params.push(`%${search}%`); idx++; }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  params.push(limit, offset);
  const { rows } = await pool.query(
    `SELECT i.*, c.name AS company_name, c.industry, c.location AS company_location
     FROM internships i
     JOIN companies c ON i.company_id = c.company_id
     ${where}
     ORDER BY i.created_at DESC
     LIMIT $${idx++} OFFSET $${idx}`,
    params
  );

  return res.json(new ApiResponse(200, rows, "Internships fetched"));
});

// ─── Get single internship (public) ──────────────────────────────────
export const getInternship = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT i.*, c.name AS company_name, c.industry, c.location AS company_location, c.website
     FROM internships i
     JOIN companies c ON i.company_id = c.company_id
     WHERE i.internship_id = $1`,
    [req.params.id]
  );
  if (rows.length === 0) throw new ApiError(404, "Internship not found");
  return res.json(new ApiResponse(200, rows[0], "Internship detail fetched"));
});

// ─── Create internship (company) ─────────────────────────────────────
export const createInternship = asyncHandler(async (req, res) => {
  const { title, stipend, duration, description } = req.body;
  if (!title) throw new ApiError(400, "Title is required");

  const { rows } = await pool.query(
    `INSERT INTO internships (title, stipend, duration, description, company_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [title, stipend || 0, duration || null, description || null, req.user.id]
  );

  return res.status(201).json(new ApiResponse(201, rows[0], "Internship created"));
});

// ─── Update internship (company) ─────────────────────────────────────
export const updateInternship = asyncHandler(async (req, res) => {
  const { title, stipend, duration, description, status } = req.body;

  const { rows } = await pool.query(
    `UPDATE internships
     SET title = COALESCE($1, title),
         stipend = COALESCE($2, stipend),
         duration = COALESCE($3, duration),
         description = COALESCE($4, description),
         status = COALESCE($5, status)
     WHERE internship_id = $6 AND company_id = $7
     RETURNING *`,
    [title || null, stipend || null, duration || null, description || null, status || null, req.params.id, req.user.id]
  );

  if (rows.length === 0) throw new ApiError(404, "Internship not found or not yours");
  return res.json(new ApiResponse(200, rows[0], "Internship updated"));
});

// ─── Delete internship (company) ─────────────────────────────────────
export const deleteInternship = asyncHandler(async (req, res) => {
  const { rowCount } = await pool.query(
    `DELETE FROM internships WHERE internship_id = $1 AND company_id = $2`,
    [req.params.id, req.user.id]
  );
  if (rowCount === 0) throw new ApiError(404, "Internship not found or not yours");
  return res.json(new ApiResponse(200, null, "Internship deleted"));
});

// ─── Apply to internship (student) ───────────────────────────────────
export const applyToInternship = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify internship is open
  const internship = await pool.query(
    `SELECT status FROM internships WHERE internship_id = $1`,
    [id]
  );
  if (internship.rows.length === 0) throw new ApiError(404, "Internship not found");
  if (internship.rows[0].status !== "open") throw new ApiError(400, "Internship is not open for applications");

  const { rows } = await pool.query(
    `INSERT INTO applications (student_id, internship_id, application_type)
     VALUES ($1, $2, 'internship')
     RETURNING *`,
    [req.user.id, id]
  );

  return res.status(201).json(new ApiResponse(201, rows[0], "Applied to internship"));
});
