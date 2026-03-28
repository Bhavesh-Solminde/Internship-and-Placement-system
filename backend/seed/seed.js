import pg from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const seed = async () => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    console.log("🌱 Seeding database...");

    // ── Hash passwords ──────────────────────────────────────────
    const hash = await bcrypt.hash("password123", 12);

    // ── Coordinator ─────────────────────────────────────────────
    const coordResult = await client.query(
      `INSERT INTO coordinators (name, email, phone, password_hash)
       VALUES ('Dr. Anjali Mehta', 'coordinator@college.edu', '9000000001', $1)
       ON CONFLICT (email) DO NOTHING
       RETURNING coordinator_id`,
      [hash]
    );
    const coordId = coordResult.rows[0]?.coordinator_id;

    if (!coordId) {
      console.log("⚠️  Coordinator already exists, fetching...");
      const existing = await client.query(
        `SELECT coordinator_id FROM coordinators WHERE email = 'coordinator@college.edu'`
      );
      var coordinatorId = existing.rows[0].coordinator_id;
    } else {
      var coordinatorId = coordId;
    }

    console.log(`  ✅ Coordinator: ${coordinatorId}`);

    // ── Company ─────────────────────────────────────────────────
    const compResult = await client.query(
      `INSERT INTO companies (name, industry, location, contact_email, password_hash, coordinator_id, website)
       VALUES ('Infosys Limited', 'IT Services', 'Bengaluru', 'hr@infosys.com', $1, $2, 'https://infosys.com')
       ON CONFLICT (contact_email) DO NOTHING
       RETURNING company_id`,
      [hash, coordinatorId]
    );
    const compId = compResult.rows[0]?.company_id;

    if (!compId) {
      const existing = await client.query(
        `SELECT company_id FROM companies WHERE contact_email = 'hr@infosys.com'`
      );
      var companyId = existing.rows[0].company_id;
    } else {
      var companyId = compId;
    }

    console.log(`  ✅ Company: ${companyId}`);

    // ── Second Company ──────────────────────────────────────────
    await client.query(
      `INSERT INTO companies (name, industry, location, contact_email, password_hash, coordinator_id, website)
       VALUES ('TCS', 'IT Consulting', 'Mumbai', 'hr@tcs.com', $1, $2, 'https://tcs.com')
       ON CONFLICT (contact_email) DO NOTHING`,
      [hash, coordinatorId]
    );

    // ── Student ─────────────────────────────────────────────────
    await client.query(
      `INSERT INTO students (name, email, phone, password_hash, gpa, coordinator_id, skills)
       VALUES ('Rahul Kumar', 'rahul@student.edu', '9876543210', $1, 8.5, $2, ARRAY['Python','SQL','React'])
       ON CONFLICT (email) DO NOTHING`,
      [hash, coordinatorId]
    );

    await client.query(
      `INSERT INTO students (name, email, phone, password_hash, gpa, coordinator_id, skills)
       VALUES ('Priya Sharma', 'priya@student.edu', '9876543211', $1, 9.1, $2, ARRAY['Java','Spring Boot','MongoDB'])
       ON CONFLICT (email) DO NOTHING`,
      [hash, coordinatorId]
    );

    console.log("  ✅ Students seeded");

    // ── Internship ──────────────────────────────────────────────
    await client.query(
      `INSERT INTO internships (title, stipend, duration, description, company_id, status)
       VALUES ('Data Analyst Intern', 15000.00, '6 months', 'Work on BI dashboards and data pipelines.', $1, 'open')
       ON CONFLICT DO NOTHING`,
      [companyId]
    );

    await client.query(
      `INSERT INTO internships (title, stipend, duration, description, company_id, status)
       VALUES ('Frontend Developer Intern', 12000.00, '3 months', 'Build React components for internal tools.', $1, 'open')
       ON CONFLICT DO NOTHING`,
      [companyId]
    );

    console.log("  ✅ Internships seeded");

    // ── Job ─────────────────────────────────────────────────────
    await client.query(
      `INSERT INTO jobs (job_title, salary, location, description, company_id, status)
       VALUES ('Software Engineer', 1200000.00, 'Bengaluru', 'Full-time SWE role — backend services.', $1, 'open')
       ON CONFLICT DO NOTHING`,
      [companyId]
    );

    await client.query(
      `INSERT INTO jobs (job_title, salary, location, description, company_id, status)
       VALUES ('DevOps Engineer', 1000000.00, 'Hyderabad', 'CI/CD pipelines and cloud infrastructure.', $1, 'open')
       ON CONFLICT DO NOTHING`,
      [companyId]
    );

    console.log("  ✅ Jobs seeded");

    await client.query("COMMIT");
    console.log("\n🎉 Seed complete!");
    console.log("   Login credentials for all seeded users: password123");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Seed failed:", err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
};

seed().catch(() => process.exit(1));
