import multer from "multer";
import { ApiError } from "../utils/apiResponse.js";

/**
 * Global error handling middleware.
 * Must be the LAST middleware registered in app.js.
 */
const errorHandler = (err, _req, res, _next) => {
  // ── Multer file-upload errors ─────────────────────────────────
  if (err instanceof multer.MulterError) {
    const messages = {
      LIMIT_FILE_SIZE: "File is too large. Maximum size is 5 MB.",
      LIMIT_UNEXPECTED_FILE: "Unexpected file field name.",
      LIMIT_FILE_COUNT: "Too many files uploaded.",
      LIMIT_FIELD_KEY: "Field name too long.",
      LIMIT_FIELD_VALUE: "Field value too long.",
      LIMIT_PART_COUNT: "Too many parts.",
    };
    return res.status(400).json({
      success: false,
      message: messages[err.code] || `Upload error: ${err.message}`,
    });
  }

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
    // Extract field names from "(email)=(value)" or "(student_id, internship_id)=(...)" pattern
    const match = detail.match(/\(([^)]+)\)/);
    const field = match ? match[1] : "field";

    // Provide friendly messages for known compound unique constraints
    if (field.includes("student_id") && field.includes("internship_id")) {
      return res.status(409).json({ success: false, message: "You have already applied to this internship." });
    }
    if (field.includes("student_id") && field.includes("job_id")) {
      return res.status(409).json({ success: false, message: "You have already applied to this job." });
    }

    return res.status(409).json({
      success: false,
      message: `Duplicate value for: ${field}`,
    });
  }

  // ── PostgreSQL foreign key violation (23503) ──────────────────
  if (err.code === "23503") {
    const detail = (err.detail || "").toLowerCase();
    let message = "Unable to complete this action. A referenced record no longer exists.";

    // Tailor message based on which FK constraint failed
    if (detail.includes("student_id")) {
      message = "Please make sure your profile is complete before applying.";
    } else if (detail.includes("internship_id") || detail.includes("job_id")) {
      message = "This listing is no longer available.";
    } else if (detail.includes("application_id")) {
      message = "The application could not be found.";
    } else if (detail.includes("company_id")) {
      message = "The company profile could not be found.";
    }

    console.error("[FK Violation]", err.detail);
    return res.status(400).json({ success: false, message });
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
