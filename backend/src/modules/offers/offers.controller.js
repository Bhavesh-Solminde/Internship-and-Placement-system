import asyncHandler from "../../shared/utils/asyncHandler.js";
import { ApiResponse, ApiError } from "../../shared/utils/apiResponse.js";
import pool from "../../config/db.js";

// ─── Issue offer ─────────────────────────────────────────────────────
export const createOffer = asyncHandler(async (req, res) => {
  const { application_id, offer_letter_url, deadline } = req.body;
  if (!application_id) throw new ApiError(400, "application_id is required");

  const { rows } = await pool.query(
    `INSERT INTO offers (application_id, offer_letter_url, deadline)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [application_id, offer_letter_url || null, deadline || null]
  );

  // Update application status to 'offered'
  await pool.query(
    `UPDATE applications SET status = 'offered' WHERE application_id = $1`,
    [application_id]
  );

  return res.status(201).json(new ApiResponse(201, rows[0], "Offer issued"));
});

// ─── Get offer by application ────────────────────────────────────────
export const getByApplication = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM offers WHERE application_id = $1`,
    [req.params.applicationId]
  );
  if (rows.length === 0) throw new ApiError(404, "No offer found for this application");
  return res.json(new ApiResponse(200, rows[0], "Offer fetched"));
});

// ─── Accept offer (student) ──────────────────────────────────────────
export const acceptOffer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Verify offer exists and belongs to this student's application
  const offer = await pool.query(
    `SELECT o.*, a.student_id FROM offers o
     JOIN applications a ON o.application_id = a.application_id
     WHERE o.offer_id = $1`,
    [id]
  );
  if (offer.rows.length === 0) throw new ApiError(404, "Offer not found");
  if (offer.rows[0].student_id !== req.user.id) throw new ApiError(403, "Not your offer");
  if (offer.rows[0].status !== "pending") throw new ApiError(400, "Offer is no longer pending");

  // Update offer status
  await pool.query(`UPDATE offers SET status = 'accepted' WHERE offer_id = $1`, [id]);
  // Update application status
  await pool.query(
    `UPDATE applications SET status = 'accepted' WHERE application_id = $1`,
    [offer.rows[0].application_id]
  );

  return res.json(new ApiResponse(200, { offer_id: id, status: "accepted" }, "Offer accepted"));
});

// ─── Reject offer (student) ─────────────────────────────────────────
export const rejectOffer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const offer = await pool.query(
    `SELECT o.*, a.student_id FROM offers o
     JOIN applications a ON o.application_id = a.application_id
     WHERE o.offer_id = $1`,
    [id]
  );
  if (offer.rows.length === 0) throw new ApiError(404, "Offer not found");
  if (offer.rows[0].student_id !== req.user.id) throw new ApiError(403, "Not your offer");

  await pool.query(`UPDATE offers SET status = 'rejected' WHERE offer_id = $1`, [id]);
  await pool.query(
    `UPDATE applications SET status = 'rejected' WHERE application_id = $1`,
    [offer.rows[0].application_id]
  );

  return res.json(new ApiResponse(200, { offer_id: id, status: "rejected" }, "Offer rejected"));
});

// ─── Update offer (company/coordinator) ──────────────────────────────
export const updateOffer = asyncHandler(async (req, res) => {
  const { offer_letter_url, deadline } = req.body;

  const { rows } = await pool.query(
    `UPDATE offers
     SET offer_letter_url = COALESCE($1, offer_letter_url),
         deadline = COALESCE($2, deadline)
     WHERE offer_id = $3
     RETURNING *`,
    [offer_letter_url || null, deadline || null, req.params.id]
  );

  if (rows.length === 0) throw new ApiError(404, "Offer not found");
  return res.json(new ApiResponse(200, rows[0], "Offer updated"));
});
