import asyncHandler from "../../shared/utils/asyncHandler.js";
import { ApiResponse, ApiError } from "../../shared/utils/apiResponse.js";
import pool from "../../config/db.js";

// ─── Get application by ID (with lifecycle) ──────────────────────────
export const getApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const app = await pool.query(
    `SELECT a.*, i.title AS internship_title, j.job_title,
            c.name AS company_name
     FROM applications a
     LEFT JOIN internships i ON a.internship_id = i.internship_id
     LEFT JOIN jobs j ON a.job_id = j.job_id
     LEFT JOIN companies c ON COALESCE(i.company_id, j.company_id) = c.company_id
     WHERE a.application_id = $1`,
    [id]
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
  }, "Application lifecycle fetched"));
});

// ─── Withdraw application (student) ──────────────────────────────────
export const withdrawApplication = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `UPDATE applications SET status = 'withdrawn'
     WHERE application_id = $1 AND student_id = $2 AND status NOT IN ('accepted','withdrawn')
     RETURNING application_id, status`,
    [req.params.id, req.user.id]
  );
  if (rows.length === 0) throw new ApiError(404, "Application not found or cannot be withdrawn");
  return res.json(new ApiResponse(200, rows[0], "Application withdrawn"));
});

// ─── Update application status (company/coordinator) ─────────────────
export const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) throw new ApiError(400, "Status is required");

  const { rows } = await pool.query(
    `UPDATE applications SET status = $1 WHERE application_id = $2 RETURNING application_id, status`,
    [status, req.params.id]
  );
  if (rows.length === 0) throw new ApiError(404, "Application not found");
  return res.json(new ApiResponse(200, rows[0], "Status updated"));
});
