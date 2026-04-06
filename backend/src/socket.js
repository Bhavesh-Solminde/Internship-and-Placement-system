import jwt from "jsonwebtoken";
import { ENV } from "./env.js";
import pool from "./config/db.js";

/**
 * initSocket — Sets up Socket.io event handlers with JWT authentication.
 * @param {import("socket.io").Server} io
 */
export const initSocket = (io) => {
  // ── Authentication middleware ─────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));

    try {
      const decoded = jwt.verify(token, ENV.JWT_SECRET);
      socket.user = decoded; // { id, role }
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  // ── Connection handler ────────────────────────────────────────────
  io.on("connection", (socket) => {
    const { id, role } = socket.user;
    console.log(`🔌 Socket connected: ${role} ${id}`);

    // Join personal room for targeted notifications
    socket.join(`user_${id}`);

    // ── Join a chat room for a specific application ──────────────
    socket.on("join_chat", async ({ applicationId }) => {
      try {
        // Verify user has access to this application
        const access = await verifyAccess(id, role, applicationId);
        if (!access) {
          socket.emit("error", { message: "Access denied to this chat" });
          return;
        }
        socket.join(`chat_${applicationId}`);
        socket.emit("joined_chat", { applicationId });
      } catch (err) {
        socket.emit("error", { message: "Failed to join chat" });
      }
    });

    // ── Leave a chat room ────────────────────────────────────────
    socket.on("leave_chat", ({ applicationId }) => {
      socket.leave(`chat_${applicationId}`);
    });

    // ── Send a message ───────────────────────────────────────────
    socket.on("send_message", async ({ applicationId, content }) => {
      try {
        if (!content?.trim()) return;

        const access = await verifyAccess(id, role, applicationId);
        if (!access) {
          socket.emit("error", { message: "Access denied" });
          return;
        }

        // Persist message
        const { rows } = await pool.query(
          `INSERT INTO messages (application_id, sender_id, sender_role, content)
           VALUES ($1, $2, $3, $4)
           RETURNING message_id, application_id, sender_id, sender_role, content, is_read, created_at`,
          [applicationId, id, role, content.trim()]
        );

        // Update last_activity_at on the application
        await pool.query(
          `UPDATE applications SET last_activity_at = NOW() WHERE application_id = $1`,
          [applicationId]
        );

        const message = rows[0];

        // Broadcast to the chat room
        io.to(`chat_${applicationId}`).emit("new_message", message);
      } catch (err) {
        console.error("[Socket] send_message error:", err.message);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // ── Mark messages as read ────────────────────────────────────
    socket.on("mark_read", async ({ applicationId }) => {
      try {
        // Mark all messages from the OTHER party as read
        const otherRole = role === "student" ? "company" : "student";
        await pool.query(
          `UPDATE messages SET is_read = TRUE
           WHERE application_id = $1 AND sender_role = $2 AND is_read = FALSE`,
          [applicationId, otherRole]
        );

        io.to(`chat_${applicationId}`).emit("messages_read", {
          applicationId,
          readBy: role,
        });
      } catch (err) {
        console.error("[Socket] mark_read error:", err.message);
      }
    });

    // ── Typing indicators ────────────────────────────────────────
    socket.on("typing", ({ applicationId }) => {
      socket.to(`chat_${applicationId}`).emit("user_typing", {
        applicationId,
        userId: id,
        role,
      });
    });

    socket.on("stop_typing", ({ applicationId }) => {
      socket.to(`chat_${applicationId}`).emit("user_stop_typing", {
        applicationId,
        userId: id,
        role,
      });
    });

    // ── Disconnect ───────────────────────────────────────────────
    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${role} ${id}`);
    });
  });
};

/**
 * Verify that a user has access to a specific application's chat.
 */
async function verifyAccess(userId, role, applicationId) {
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
}
