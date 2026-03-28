import pg from "pg";
import { ENV } from "../env.js";

const { Pool } = pg;

const pool = new Pool({ connectionString: ENV.DATABASE_URL });

pool.on("error", (err) => {
  console.error("PG idle client error:", err.message);
});

export default pool;
