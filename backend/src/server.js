import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app.js";
import { ENV } from "./env.js";
import pool from "./config/db.js";
import { initSocket } from "./socket.js";
import { startExpiryJob } from "./modules/expiry/expiryJob.js";

const startServer = async () => {
  try {
    // Verify PostgreSQL connection
    const result = await pool.query("SELECT NOW()");
    console.log("✅ PostgreSQL connected:", result.rows[0].now);

    // Create HTTP server and attach Socket.io
    const httpServer = createServer(app);
    const io = new Server(httpServer, {
      cors: {
        origin: ENV.CLIENT_URL,
        credentials: true,
      },
    });

    // Store io on app for access in route handlers
    app.set("io", io);

    // Initialize socket event handlers
    initSocket(io);

    // Start the application expiry cron job
    startExpiryJob();

    httpServer.listen(ENV.PORT, () => {
      console.log(
        `🚀 Server running in ${ENV.NODE_ENV} mode on port ${ENV.PORT}`
      );
    });
  } catch (error) {
    console.error("❌ Failed to connect to PostgreSQL:", error.message);
    process.exit(1);
  }
};

startServer();
