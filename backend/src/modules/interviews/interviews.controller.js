import asyncHandler from "../../shared/utils/asyncHandler.js";
import { ApiResponse, ApiError } from "../../shared/utils/apiResponse.js";
import pool from "../../config/db.js";

// ─── Schedule interview ──────────────────────────────────────────────
export const createInterview = asyncHandler(async (req, res) => {
  const { application_id, date, round, mode, notes } = req.body;
  if (!application_id || !date) throw new ApiError(400, "application_id and date are required");

  const { rows } = await pool.query(
    `INSERT INTO interviews (application_id, date, round, mode, notes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [application_id, date, round || null, mode || null, notes || null]
  );

  // Auto-update application status to shortlisted
  await pool.query(
    `UPDATE applications SET status = 'shortlisted'
     WHERE application_id = $1 AND status IN ('pending', 'under_review')`,
    [application_id]
  );

  return res.status(201).json(new ApiResponse(201, rows[0], "Interview scheduled"));
});

// ─── Get interviews by application ───────────────────────────────────
export const getByApplication = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM interviews WHERE application_id = $1 ORDER BY date ASC`,
    [req.params.applicationId]
  );
  return res.json(new ApiResponse(200, rows, "Interviews fetched"));
});

// ─── Update interview ────────────────────────────────────────────────
export const updateInterview = asyncHandler(async (req, res) => {
  const { date, round, mode, result, notes } = req.body;

  const { rows } = await pool.query(
    `UPDATE interviews
     SET date = COALESCE($1, date),
         round = COALESCE($2, round),
         mode = COALESCE($3, mode),
         result = COALESCE($4, result),
         notes = COALESCE($5, notes)
     WHERE interview_id = $6
     RETURNING *`,
    [date || null, round || null, mode || null, result || null, notes || null, req.params.id]
  );

  if (rows.length === 0) throw new ApiError(404, "Interview not found");
  return res.json(new ApiResponse(200, rows[0], "Interview updated"));
});

// ─── Delete interview ────────────────────────────────────────────────
export const deleteInterview = asyncHandler(async (req, res) => {
  const { rowCount } = await pool.query(
    `DELETE FROM interviews WHERE interview_id = $1`,
    [req.params.id]
  );
  if (rowCount === 0) throw new ApiError(404, "Interview not found");
  return res.json(new ApiResponse(200, null, "Interview cancelled"));
});
