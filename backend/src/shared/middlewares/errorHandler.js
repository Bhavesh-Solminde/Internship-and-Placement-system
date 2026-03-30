import { ApiError } from "../utils/apiResponse.js";

/**
 * Global error handling middleware.
 * Must be the LAST middleware registered in app.js.
 */
const errorHandler = (err, _req, res, _next) => {
  // ── Known ApiError ─────────────────────────────────────────────
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  // ── PostgreSQL unique violation (23505) ───────────────────────
  if (err.code === "23505") {
    const detail = err.detail || "";
    // Extract field name from "(email)=(value)" pattern
    const match = detail.match(/\((\w+)\)/);
    const field = match ? match[1] : "field";
    return res.status(409).json({
      success: false,
      message: `Duplicate value for: ${field}`,
    });
  }

  // ── PostgreSQL foreign key violation (23503) ──────────────────
  if (err.code === "23503") {
    return res.status(400).json({
      success: false,
      message: "Referenced record does not exist",
      detail: err.detail,
    });
  }

  // ── PostgreSQL check constraint violation (23514) ─────────────
  if (err.code === "23514") {
    return res.status(400).json({
      success: false,
      message: "Value violates a check constraint",
      detail: err.detail,
    });
  }

  // ── PostgreSQL not-null violation (23502) ──────────────────────
  if (err.code === "23502") {
    return res.status(400).json({
      success: false,
      message: `Missing required field: ${err.column}`,
    });
  }

  // ── Fallback ──────────────────────────────────────────────────
  console.error("Unhandled Error:", err);
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};

export default errorHandler;
