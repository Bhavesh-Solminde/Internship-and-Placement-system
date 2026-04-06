import cron from "node-cron";
import pool from "../../config/db.js";

/**
 * startExpiryJob — Runs daily at midnight to expire stale applications.
 * An application expires if it has had no activity for 45 days.
 * "Activity" = any status change, message sent, or task assigned
 * (all of which update last_activity_at).
 */
export const startExpiryJob = () => {
  // Run every day at midnight
  cron.schedule("0 0 * * *", async () => {
    console.log("⏳ Running application expiry check...");

    try {
      const { rows, rowCount } = await pool.query(
        `UPDATE applications
         SET status = 'expired', last_activity_at = NOW()
         WHERE status NOT IN ('accepted', 'rejected', 'withdrawn', 'expired')
           AND last_activity_at < NOW() - INTERVAL '45 days'
         RETURNING application_id`
      );

      if (rowCount > 0) {
        console.log(`  ⚠️  Expired ${rowCount} application(s):`, rows.map(r => r.application_id).join(", "));
      } else {
        console.log("  ✅ No applications to expire.");
      }
    } catch (err) {
      console.error("  ❌ Expiry job failed:", err.message);
    }
  });

  console.log("📅 Application expiry cron job scheduled (daily at midnight)");
};
