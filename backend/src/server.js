import app from "./app.js";
import { ENV } from "./env.js";
import pool from "./config/db.js";

const startServer = async () => {
  try {
    // Verify PostgreSQL connection
    const result = await pool.query("SELECT NOW()");
    console.log("✅ PostgreSQL connected:", result.rows[0].now);

    app.listen(ENV.PORT, () => {
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
