import asyncHandler from "../../shared/utils/asyncHandler.js";
import { ApiResponse, ApiError } from "../../shared/utils/apiResponse.js";
import pool from "../../config/db.js";

// ─── Initiate onboarding ─────────────────────────────────────────────
export const createOnboarding = asyncHandler(async (req, res) => {
  const { offer_id, joining_date, notes } = req.body;
  if (!offer_id) throw new ApiError(400, "offer_id is required");

  // Verify the offer is accepted
  const offer = await pool.query(
    `SELECT status FROM offers WHERE offer_id = $1`,
    [offer_id]
  );
  if (offer.rows.length === 0) throw new ApiError(404, "Offer not found");
  if (offer.rows[0].status !== "accepted") {
    throw new ApiError(400, "Can only onboard for accepted offers");
  }

  const { rows } = await pool.query(
    `INSERT INTO onboarding (offer_id, joining_date, notes)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [offer_id, joining_date || null, notes || null]
  );

  return res.status(201).json(new ApiResponse(201, rows[0], "Onboarding initiated"));
});

// ─── Get onboarding by offer ─────────────────────────────────────────
export const getByOffer = asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM onboarding WHERE offer_id = $1`,
    [req.params.offerId]
  );
  if (rows.length === 0) throw new ApiError(404, "No onboarding record found");
  return res.json(new ApiResponse(200, rows[0], "Onboarding record fetched"));
});

// ─── Update onboarding ──────────────────────────────────────────────
export const updateOnboarding = asyncHandler(async (req, res) => {
  const { joining_date, status, notes } = req.body;

  const { rows } = await pool.query(
    `UPDATE onboarding
     SET joining_date = COALESCE($1, joining_date),
         status = COALESCE($2, status),
         notes = COALESCE($3, notes),
         updated_at = NOW()
     WHERE onboarding_id = $4
     RETURNING *`,
    [joining_date || null, status || null, notes || null, req.params.id]
  );

  if (rows.length === 0) throw new ApiError(404, "Onboarding record not found");
  return res.json(new ApiResponse(200, rows[0], "Onboarding updated"));
});
