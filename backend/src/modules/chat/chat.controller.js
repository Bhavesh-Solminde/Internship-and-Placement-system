import asyncHandler from "../../shared/utils/asyncHandler.js";
import { ApiResponse, ApiError } from "../../shared/utils/apiResponse.js";
import pool from "../../config/db.js";

/**
 * Verify the current user has access to an application's chat.
 */
const verifyAppAccess = async (userId, role, applicationId) => {
  if (role === "student") {
    const { rows } = await pool.query(
      `SELECT application_id FROM applications WHERE application_id = $1 AND student_id = $2`,
      [applicationId, userId]
    );
    return rows.length > 0;
  }

  if (role === "company") {
    const { rows } = await pool.query(
      `SELECT a.application_id FROM applications a
       LEFT JOIN internships i ON a.internship_id = i.internship_id
       LEFT JOIN jobs j ON a.job_id = j.job_id
       WHERE a.application_id = $1
         AND (i.company_id = $2 OR j.company_id = $2)`,
      [applicationId, userId]
    );
    return rows.length > 0;
  }

  return false;
};

// ─── Get all chat threads for current user ───────────────────────────
export const getThreads = asyncHandler(async (req, res) => {
  const { id, role } = req.user;

  let query;
  if (role === "student") {
    query = `
      SELECT a.application_id, a.status, a.apply_date, a.application_type, a.last_activity_at,
             i.title AS internship_title, j.job_title,
             c.name AS company_name, c.company_id,
             (SELECT content FROM messages WHERE application_id = a.application_id ORDER BY created_at DESC LIMIT 1) AS last_message,
             (SELECT created_at FROM messages WHERE application_id = a.application_id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
             (SELECT sender_role FROM messages WHERE application_id = a.application_id ORDER BY created_at DESC LIMIT 1) AS last_message_role,
             (SELECT COUNT(*) FROM messages WHERE application_id = a.application_id AND sender_role = 'company' AND is_read = FALSE)::int AS unread_count
      FROM applications a
      LEFT JOIN internships i ON a.internship_id = i.internship_id
      LEFT JOIN jobs j ON a.job_id = j.job_id
      LEFT JOIN companies c ON COALESCE(i.company_id, j.company_id) = c.company_id
      WHERE a.student_id = $1
      ORDER BY COALESCE(
        (SELECT created_at FROM messages WHERE application_id = a.application_id ORDER BY created_at DESC LIMIT 1),
        a.apply_date
      ) DESC`;
  } else if (role === "company") {
    query = `
      SELECT a.application_id, a.status, a.apply_date, a.application_type, a.last_activity_at,
             i.title AS internship_title, j.job_title,
             s.name AS student_name, s.student_id, s.cgpa, s.skills, s.email AS student_email,
             s.resume_url, s.phone AS student_phone, s.location AS student_location,
             s.linkedin_url, s.github_url, s.portfolio_url,
             s.education, s.experience, s.projects, s.experience_years,
             (SELECT content FROM messages WHERE application_id = a.application_id ORDER BY created_at DESC LIMIT 1) AS last_message,
             (SELECT created_at FROM messages WHERE application_id = a.application_id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
             (SELECT sender_role FROM messages WHERE application_id = a.application_id ORDER BY created_at DESC LIMIT 1) AS last_message_role,
             (SELECT COUNT(*) FROM messages WHERE application_id = a.application_id AND sender_role = 'student' AND is_read = FALSE)::int AS unread_count
      FROM applications a
      LEFT JOIN internships i ON a.internship_id = i.internship_id
      LEFT JOIN jobs j ON a.job_id = j.job_id
      LEFT JOIN students s ON a.student_id = s.student_id
      WHERE (i.company_id = $1 OR j.company_id = $1)
      ORDER BY COALESCE(
        (SELECT created_at FROM messages WHERE application_id = a.application_id ORDER BY created_at DESC LIMIT 1),
        a.apply_date
      ) DESC`;
  } else {
    throw new ApiError(403, "Only students and companies can access chat");
  }

  const { rows } = await pool.query(query, [id]);
  return res.json(new ApiResponse(200, rows, "Chat threads fetched"));
});

// ─── Get messages for a specific application ─────────────────────────
export const getMessages = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { id, role } = req.user;

  const hasAccess = await verifyAppAccess(id, role, applicationId);
  if (!hasAccess) throw new ApiError(403, "Access denied to this chat");

  const { rows } = await pool.query(
    `SELECT message_id, application_id, sender_id, sender_role, content, is_read, created_at
     FROM messages
     WHERE application_id = $1
     ORDER BY created_at ASC`,
    [applicationId]
  );

  return res.json(new ApiResponse(200, rows, "Messages fetched"));
});

// ─── Mark messages as read ───────────────────────────────────────────
export const markRead = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { id, role } = req.user;

  const hasAccess = await verifyAppAccess(id, role, applicationId);
  if (!hasAccess) throw new ApiError(403, "Access denied to this chat");

  const otherRole = role === "student" ? "company" : "student";
  await pool.query(
    `UPDATE messages SET is_read = TRUE
     WHERE application_id = $1 AND sender_role = $2 AND is_read = FALSE`,
    [applicationId, otherRole]
  );

  return res.json(new ApiResponse(200, null, "Messages marked as read"));
});
