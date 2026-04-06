import asyncHandler from "../../shared/utils/asyncHandler.js";
import { ApiResponse, ApiError } from "../../shared/utils/apiResponse.js";
import pool from "../../config/db.js";
import fs from "fs";

// ─── Create task (company only) ──────────────────────────────────────
export const createTask = asyncHandler(async (req, res) => {
  const { application_id, title, description, deadline } = req.body;
  const companyId = req.user.id;

  if (!application_id || !title || !deadline) {
    throw new ApiError(400, "application_id, title, and deadline are required");
  }

  // Verify company owns this application
  const appCheck = await pool.query(
    `SELECT a.application_id FROM applications a
     LEFT JOIN internships i ON a.internship_id = i.internship_id
     LEFT JOIN jobs j ON a.job_id = j.job_id
     WHERE a.application_id = $1
       AND (i.company_id = $2 OR j.company_id = $2)`,
    [application_id, companyId]
  );
  if (appCheck.rows.length === 0) {
    throw new ApiError(404, "Application not found or not authorized");
  }

  // Create the task
  const { rows } = await pool.query(
    `INSERT INTO tasks (application_id, title, description, deadline)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [application_id, title, description || null, deadline]
  );

  // Insert a system message in the chat about the task
  await pool.query(
    `INSERT INTO messages (application_id, sender_id, sender_role, content)
     VALUES ($1, $2, 'company', $3)`,
    [
      application_id,
      companyId,
      `📋 Task assigned: "${title}"\nDeadline: ${new Date(deadline).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}${description ? `\n\n${description}` : ""}`,
    ]
  );

  // Update last_activity_at
  await pool.query(
    `UPDATE applications SET last_activity_at = NOW() WHERE application_id = $1`,
    [application_id]
  );

  // Emit real-time notification via Socket.io if available
  const io = req.app.get("io");
  if (io) {
    io.to(`chat_${application_id}`).emit("task_assigned", rows[0]);

    const msgResult = await pool.query(
      `SELECT * FROM messages WHERE application_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [application_id]
    );
    if (msgResult.rows.length > 0) {
      io.to(`chat_${application_id}`).emit("new_message", msgResult.rows[0]);
    }
  }

  return res.status(201).json(new ApiResponse(201, rows[0], "Task assigned successfully"));
});

// ─── Get tasks for an application ────────────────────────────────────
export const getTasksByApplication = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { id, role } = req.user;

  // Verify access
  let hasAccess = false;
  if (role === "student") {
    const { rows } = await pool.query(
      `SELECT application_id FROM applications WHERE application_id = $1 AND student_id = $2`,
      [applicationId, id]
    );
    hasAccess = rows.length > 0;
  } else if (role === "company") {
    const { rows } = await pool.query(
      `SELECT a.application_id FROM applications a
       LEFT JOIN internships i ON a.internship_id = i.internship_id
       LEFT JOIN jobs j ON a.job_id = j.job_id
       WHERE a.application_id = $1
         AND (i.company_id = $2 OR j.company_id = $2)`,
      [applicationId, id]
    );
    hasAccess = rows.length > 0;
  }

  if (!hasAccess) throw new ApiError(403, "Access denied");

  const { rows } = await pool.query(
    `SELECT * FROM tasks WHERE application_id = $1 ORDER BY created_at DESC`,
    [applicationId]
  );

  return res.json(new ApiResponse(200, rows, "Tasks fetched"));
});

// ─── Submit assignment (student only) ────────────────────────────────
export const completeTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const studentId = req.user.id;

  // Verify this task belongs to an application owned by the student
  const taskCheck = await pool.query(
    `SELECT t.*, a.application_id FROM tasks t
     JOIN applications a ON t.application_id = a.application_id
     WHERE t.task_id = $1 AND a.student_id = $2`,
    [taskId, studentId]
  );

  if (taskCheck.rows.length === 0) {
    throw new ApiError(404, "Task not found or not authorized");
  }

  const task = taskCheck.rows[0];

  if (task.status === "completed") {
    throw new ApiError(400, "Task is already completed");
  }

  // Extract submission fields from body
  const { submission_link, submission_notes } = req.body;
  let submissionFileUrl = null;

  // Upload file if provided
  if (req.file) {
    const hasCloudinaryConfig =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name" &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (hasCloudinaryConfig) {
      try {
        const { uploadToCloudinary } = await import("../../shared/utils/cloudinary.js");
        const result = await uploadToCloudinary(req.file.path, "smartniyukti/submissions");
        submissionFileUrl = result.secure_url;
        // Clean up temp file after successful Cloudinary upload
        try { fs.unlinkSync(req.file.path); } catch (_) { /* ignore */ }
      } catch (uploadErr) {
        console.error("[Cloudinary] Upload failed, falling back to local:", uploadErr.message);
        submissionFileUrl = `/uploads/${req.file.filename}`;
      }
    } else {
      // No Cloudinary — serve file locally
      submissionFileUrl = `/uploads/${req.file.filename}`;
    }
  }

  const { rows } = await pool.query(
    `UPDATE tasks
     SET status = 'completed',
         submission_file_url = $1,
         submission_link = $2,
         submission_notes = $3,
         submitted_at = NOW(),
         updated_at = NOW()
     WHERE task_id = $4
     RETURNING *`,
    [submissionFileUrl, submission_link || null, submission_notes || null, taskId]
  );

  // Build system message with submission details
  let msgParts = [`✅ Task completed: "${task.title}"`];
  if (submissionFileUrl) msgParts.push(`📎 File attached`);
  if (submission_link) msgParts.push(`🔗 ${submission_link}`);
  if (submission_notes) msgParts.push(`📝 ${submission_notes}`);

  await pool.query(
    `INSERT INTO messages (application_id, sender_id, sender_role, content)
     VALUES ($1, $2, 'student', $3)`,
    [task.application_id, studentId, msgParts.join("\n")]
  );

  // Update last_activity_at
  await pool.query(
    `UPDATE applications SET last_activity_at = NOW() WHERE application_id = $1`,
    [task.application_id]
  );

  // Emit real-time notification
  const io = req.app.get("io");
  if (io) {
    io.to(`chat_${task.application_id}`).emit("task_completed", rows[0]);

    const msgResult = await pool.query(
      `SELECT * FROM messages WHERE application_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [task.application_id]
    );
    if (msgResult.rows.length > 0) {
      io.to(`chat_${task.application_id}`).emit("new_message", msgResult.rows[0]);
    }
  }

  return res.json(new ApiResponse(200, rows[0], "Assignment submitted successfully"));
});

// ─── Update application status (company only, from chat) ─────────────
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { status } = req.body;
  const companyId = req.user.id;

  const allowedStatuses = ["under_review", "shortlisted", "offered", "accepted", "rejected"];
  if (!status || !allowedStatuses.includes(status)) {
    throw new ApiError(400, `Invalid status. Allowed: ${allowedStatuses.join(", ")}`);
  }

  // Verify company owns this application
  const appCheck = await pool.query(
    `SELECT a.application_id, a.status AS current_status, a.student_id FROM applications a
     LEFT JOIN internships i ON a.internship_id = i.internship_id
     LEFT JOIN jobs j ON a.job_id = j.job_id
     WHERE a.application_id = $1
       AND (i.company_id = $2 OR j.company_id = $2)`,
    [applicationId, companyId]
  );

  if (appCheck.rows.length === 0) {
    throw new ApiError(404, "Application not found or not authorized");
  }

  const app = appCheck.rows[0];

  // Update application status and reset expiry timer
  const { rows } = await pool.query(
    `UPDATE applications SET status = $1, last_activity_at = NOW()
     WHERE application_id = $2
     RETURNING application_id, status, last_activity_at`,
    [status, applicationId]
  );

  // Insert a system message about the status change
  const statusLabels = {
    under_review: "Under Review",
    shortlisted: "Shortlisted",
    offered: "Offered",
    accepted: "Accepted",
    rejected: "Rejected",
  };

  await pool.query(
    `INSERT INTO messages (application_id, sender_id, sender_role, content)
     VALUES ($1, $2, 'company', $3)`,
    [applicationId, companyId, `📌 Application status updated to: ${statusLabels[status]}`]
  );

  // Emit real-time notification
  const io = req.app.get("io");
  if (io) {
    // Notify the chat room
    io.to(`chat_${applicationId}`).emit("status_updated", {
      applicationId,
      status,
    });

    // Also notify the student directly
    io.to(`user_${app.student_id}`).emit("status_updated", {
      applicationId,
      status,
    });

    // Emit the system message
    const msgResult = await pool.query(
      `SELECT * FROM messages WHERE application_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [applicationId]
    );
    if (msgResult.rows.length > 0) {
      io.to(`chat_${applicationId}`).emit("new_message", msgResult.rows[0]);
    }
  }

  return res.json(new ApiResponse(200, rows[0], `Application status updated to ${status}`));
});
