import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const migrate = async () => {
  const client = await pool.connect();
  try {
    const sqlPath = path.join(__dirname, "..", "migrations", "001_chat_tasks_expiry.sql");
    const sql = fs.readFileSync(sqlPath, "utf-8");
    
    console.log("🔄 Running migration: 001_chat_tasks_expiry.sql");
    await client.query(sql);
    console.log("✅ Migration complete!");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

migrate().catch(() => process.exit(1));
