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
    const tcsResult = await client.query(
      `INSERT INTO companies (name, industry, location, contact_email, password_hash, coordinator_id, website)
       VALUES ('TCS', 'IT Consulting', 'Mumbai', 'hr@tcs.com', $1, $2, 'https://tcs.com')
       ON CONFLICT (contact_email) DO NOTHING
       RETURNING company_id`,
      [hash, coordinatorId]
    );
    let tcsId = tcsResult.rows[0]?.company_id;
    if (!tcsId) {
      const existingTcs = await client.query(
        `SELECT company_id FROM companies WHERE contact_email = 'hr@tcs.com'`
      );
      tcsId = existingTcs.rows[0].company_id;
    }

    // ── Students ────────────────────────────────────────────────
    const student1Result = await client.query(
      `INSERT INTO students (name, email, phone, password_hash, cgpa, coordinator_id, skills, location, linkedin_url, github_url)
       VALUES ('Rahul Kumar', 'rahul@student.edu', '9876543210', $1, 8.5, $2, ARRAY['Python','SQL','React'], 'Bengaluru', 'https://linkedin.com/in/rahul', 'https://github.com/rahul')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING student_id`,
      [hash, coordinatorId]
    );
    const student1Id = student1Result.rows[0].student_id;

    const student2Result = await client.query(
      `INSERT INTO students (name, email, phone, password_hash, cgpa, coordinator_id, skills, location, linkedin_url)
       VALUES ('Priya Sharma', 'priya@student.edu', '9876543211', $1, 9.1, $2, ARRAY['Java','Spring Boot','MongoDB'], 'Mumbai', 'https://linkedin.com/in/priya')
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
       RETURNING student_id`,
      [hash, coordinatorId]
    );
    const student2Id = student2Result.rows[0].student_id;

    console.log("  ✅ Students seeded");

    // ── Internships ─────────────────────────────────────────────
    const internResult = await client.query(
      `INSERT INTO internships (title, stipend, duration, description, company_id, status, deadline, required_experience_years)
       VALUES 
       ('Data Analyst Intern', 15000.00, '6 months', 'Work on BI dashboards and data pipelines using Python and SQL.', $1, 'open', NOW() + INTERVAL '30 days', 0),
       ('Frontend Developer Intern', 12000.00, '3 months', 'Build React components for internal tools and client-facing interfaces.', $1, 'open', NOW() + INTERVAL '45 days', 0),
       ('Backend Node.js Intern', 20000.00, '6 months', 'Develop RESTful APIs using Express and PostgreSQL.', $1, 'open', NOW() + INTERVAL '15 days', 0),
       ('Machine Learning Intern', 25000.00, '6 months', 'Collaborate on predictive models and NLP tasks.', $2, 'open', NOW() + INTERVAL '20 days', 0),
       ('Cloud Operations Intern', 18000.00, '4 months', 'Assist in AWS infrastructure management and CI/CD operations.', $2, 'open', NOW() + INTERVAL '10 days', 0),
       ('Product Management Intern', 15000.00, '3 months', 'Help define product roadmaps and gather user feedback.', $2, 'open', NOW() + INTERVAL '45 days', 0)
       ON CONFLICT DO NOTHING
       RETURNING internship_id, title`,
      [companyId, tcsId]
    );

    console.log("  ✅ Internships seeded");

    // ── Jobs ────────────────────────────────────────────────────
    await client.query(
      `INSERT INTO jobs (job_title, salary, location, description, company_id, status, deadline, required_experience_years)
       VALUES 
       ('Software Engineer', 1200000.00, 'Bengaluru', 'Full-time SWE role — backend services.', $1, 'open', NOW() + INTERVAL '60 days', 0),
       ('Senior Data Scientist', 2500000.00, 'Bengaluru', 'Lead data science initiatives and mentor juniors.', $1, 'open', NOW() + INTERVAL '30 days', 3),
       ('DevOps Engineer', 1000000.00, 'Hyderabad', 'CI/CD pipelines and cloud infrastructure.', $1, 'closed', NOW() - INTERVAL '2 days', 1),
       ('React Native Developer', 1400000.00, 'Mumbai', 'Develop cross-platform mobile apps.', $2, 'filled', NOW() - INTERVAL '30 days', 2),
       ('Database Administrator', 1100000.00, 'Pune', 'Manage PostgreSQL databases and optimize queries.', $2, 'open', NOW() + INTERVAL '15 days', 1)
       ON CONFLICT DO NOTHING`,
      [companyId, tcsId]
    );

    console.log("  ✅ Jobs seeded");

    // ── Get internship IDs for applications ─────────────────────
    const internships = await client.query(
      `SELECT internship_id, title, company_id FROM internships ORDER BY created_at ASC`
    );
    const intern1 = internships.rows[0]; // Data Analyst (Infosys)
    const intern2 = internships.rows[1]; // Frontend Developer (Infosys)
    const intern3 = internships.rows[2]; // Backend Node.js (Infosys)
    const intern4 = internships.rows[3]; // ML (TCS)
    const intern5 = internships.rows[4]; // Cloud Ops (TCS)

    // ── Applications with varying last_activity_at ──────────────
    console.log("  📝 Seeding applications...");

    // App 1: Rahul → Data Analyst (Infosys) — Active chat, 35 days remaining
    const app1Res = await client.query(
      `INSERT INTO applications (student_id, internship_id, application_type, status, apply_date, last_activity_at)
       VALUES ($1, $2, 'internship', 'under_review', NOW() - INTERVAL '20 days', NOW() - INTERVAL '10 days')
       ON CONFLICT (student_id, internship_id) DO UPDATE SET status = 'under_review', last_activity_at = NOW() - INTERVAL '10 days'
       RETURNING application_id`,
      [student1Id, intern1.internship_id]
    );
    const app1Id = app1Res.rows[0].application_id;

    // App 2: Rahul → Frontend Dev (Infosys) — Expiring soon (5 days left)
    const app2Res = await client.query(
      `INSERT INTO applications (student_id, internship_id, application_type, status, apply_date, last_activity_at)
       VALUES ($1, $2, 'internship', 'shortlisted', NOW() - INTERVAL '50 days', NOW() - INTERVAL '40 days')
       ON CONFLICT (student_id, internship_id) DO UPDATE SET status = 'shortlisted', last_activity_at = NOW() - INTERVAL '40 days'
       RETURNING application_id`,
      [student1Id, intern2.internship_id]
    );
    const app2Id = app2Res.rows[0].application_id;

    // App 3: Priya → ML Intern (TCS) — New, 44 days remaining
    const app3Res = await client.query(
      `INSERT INTO applications (student_id, internship_id, application_type, status, apply_date, last_activity_at)
       VALUES ($1, $2, 'internship', 'pending', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day')
       ON CONFLICT (student_id, internship_id) DO UPDATE SET status = 'pending', last_activity_at = NOW() - INTERVAL '1 day'
       RETURNING application_id`,
      [student2Id, intern4.internship_id]
    );
    const app3Id = app3Res.rows[0].application_id;

    // App 4: Priya → Cloud Ops (TCS) — Already expired (50 days without activity)
    const app4Res = await client.query(
      `INSERT INTO applications (student_id, internship_id, application_type, status, apply_date, last_activity_at)
       VALUES ($1, $2, 'internship', 'expired', NOW() - INTERVAL '55 days', NOW() - INTERVAL '50 days')
       ON CONFLICT (student_id, internship_id) DO UPDATE SET status = 'expired', last_activity_at = NOW() - INTERVAL '50 days'
       RETURNING application_id`,
      [student2Id, intern5.internship_id]
    );
    const app4Id = app4Res.rows[0].application_id;

    // App 5: Rahul → Backend Node.js (Infosys) — Active, 20 days remaining
    const app5Res = await client.query(
      `INSERT INTO applications (student_id, internship_id, application_type, status, apply_date, last_activity_at)
       VALUES ($1, $2, 'internship', 'under_review', NOW() - INTERVAL '30 days', NOW() - INTERVAL '25 days')
       ON CONFLICT (student_id, internship_id) DO UPDATE SET status = 'under_review', last_activity_at = NOW() - INTERVAL '25 days'
       RETURNING application_id`,
      [student1Id, intern3.internship_id]
    );
    const app5Id = app5Res.rows[0].application_id;

    console.log("  ✅ Applications seeded");

    // ── Chat Messages ───────────────────────────────────────────
    console.log("  💬 Seeding chat messages...");

    // App 1: Active conversation between Rahul and Infosys
    await client.query(
      `INSERT INTO messages (application_id, sender_id, sender_role, content, is_read, created_at) VALUES
       ($1, $2, 'company', 'Hello Rahul! Thank you for applying for the Data Analyst Intern position at Infosys. We were impressed by your profile.', TRUE, NOW() - INTERVAL '18 days'),
       ($1, $2, 'company', 'We would like to proceed with your application. Could you please complete a short assessment?', TRUE, NOW() - INTERVAL '18 days' + INTERVAL '5 minutes'),
       ($1, $3, 'student', 'Thank you for considering my application! I would be happy to complete the assessment.', TRUE, NOW() - INTERVAL '17 days'),
       ($1, $3, 'student', 'Could you share the details about the assessment?', TRUE, NOW() - INTERVAL '17 days' + INTERVAL '2 minutes'),
       ($1, $2, 'company', 'Sure! Please refer to the task assigned below. You have one week to complete it.', TRUE, NOW() - INTERVAL '16 days'),
       ($1, $3, 'student', 'I have started working on the assessment. Will submit it before the deadline.', TRUE, NOW() - INTERVAL '14 days'),
       ($1, $2, 'company', 'Great! Take your time and focus on quality. Let me know if you have any questions.', TRUE, NOW() - INTERVAL '13 days'),
       ($1, $3, 'student', 'Sure, I will submit. But will it be considered? This is a demo of what I make.', FALSE, NOW() - INTERVAL '10 days')
       ON CONFLICT DO NOTHING`,
      [app1Id, companyId, student1Id]
    );

    // App 2: Conversation with expiring application
    await client.query(
      `INSERT INTO messages (application_id, sender_id, sender_role, content, is_read, created_at) VALUES
       ($1, $2, 'company', 'Hi Rahul, congratulations on being shortlisted for the Frontend Developer Intern role!', TRUE, NOW() - INTERVAL '45 days'),
       ($1, $2, 'company', 'We would like to schedule a technical interview. Please let us know your availability.', TRUE, NOW() - INTERVAL '45 days' + INTERVAL '3 minutes'),
       ($1, $3, 'student', 'Thank you! I am available next Monday or Wednesday between 10 AM - 4 PM.', TRUE, NOW() - INTERVAL '44 days'),
       ($1, $2, 'company', 'Perfect, we will confirm the slot shortly.', TRUE, NOW() - INTERVAL '40 days')
       ON CONFLICT DO NOTHING`,
      [app2Id, companyId, student1Id]
    );

    // App 3: New conversation
    await client.query(
      `INSERT INTO messages (application_id, sender_id, sender_role, content, is_read, created_at) VALUES
       ($1, $2, 'company', 'Hello Priya! Thank you for your interest in the Machine Learning Intern position at TCS. We are reviewing your application.', FALSE, NOW() - INTERVAL '12 hours')
       ON CONFLICT DO NOTHING`,
      [app3Id, tcsId]
    );

    // App 4: Expired application conversation
    await client.query(
      `INSERT INTO messages (application_id, sender_id, sender_role, content, is_read, created_at) VALUES
       ($1, $2, 'company', 'Hi Priya, thanks for applying to the Cloud Operations Intern role.', TRUE, NOW() - INTERVAL '50 days'),
       ($1, $3, 'student', 'Thank you! Looking forward to hearing back.', TRUE, NOW() - INTERVAL '49 days')
       ON CONFLICT DO NOTHING`,
      [app4Id, tcsId, student2Id]
    );

    // App 5: Backend Node.js conversation
    await client.query(
      `INSERT INTO messages (application_id, sender_id, sender_role, content, is_read, created_at) VALUES
       ($1, $2, 'company', 'Hello Rahul! We noticed you applied for the Backend Node.js Intern position as well. Great to see your enthusiasm!', TRUE, NOW() - INTERVAL '28 days'),
       ($1, $3, 'student', 'Yes! I am very interested in backend development with Node.js and PostgreSQL.', TRUE, NOW() - INTERVAL '27 days'),
       ($1, $2, 'company', 'Excellent! We have assigned a small coding task for you. Please check it out.', TRUE, NOW() - INTERVAL '25 days')
       ON CONFLICT DO NOTHING`,
      [app5Id, companyId, student1Id]
    );

    console.log("  ✅ Chat messages seeded");

    // ── Tasks ───────────────────────────────────────────────────
    console.log("  📋 Seeding tasks...");

    // Task 1: Pending task with future deadline (App 1)
    await client.query(
      `INSERT INTO tasks (application_id, title, description, deadline, status, created_at) VALUES
       ($1, 'Data Analysis Assessment', 'Analyse the provided CSV dataset and create a dashboard using Python and any visualization library. Submit your Jupyter notebook.', NOW() + INTERVAL '5 days', 'pending', NOW() - INTERVAL '16 days')
       ON CONFLICT DO NOTHING`,
      [app1Id]
    );

    // Task 2: Completed task (App 5)
    await client.query(
      `INSERT INTO tasks (application_id, title, description, deadline, status, created_at, updated_at) VALUES
       ($1, 'REST API Challenge', 'Build a simple REST API with Express.js that implements CRUD operations for a todo list with PostgreSQL.', NOW() - INTERVAL '5 days', 'completed', NOW() - INTERVAL '25 days', NOW() - INTERVAL '20 days')
       ON CONFLICT DO NOTHING`,
      [app5Id]
    );

    // Task 3: Overdue pending task (App 2 — expiring soon)
    await client.query(
      `INSERT INTO tasks (application_id, title, description, deadline, status, created_at) VALUES
       ($1, 'Frontend Component Build', 'Create a responsive React component that displays a product card with hover animations. Use Tailwind CSS.', NOW() - INTERVAL '10 days', 'pending', NOW() - INTERVAL '40 days')
       ON CONFLICT DO NOTHING`,
      [app2Id]
    );

    // Task 4: Pending task expiring soon (App 5)
    await client.query(
      `INSERT INTO tasks (application_id, title, description, deadline, status, created_at) VALUES
       ($1, 'Database Design Task', 'Design a normalized PostgreSQL schema for a library management system. Include ER diagram and SQL DDL.', NOW() + INTERVAL '3 days', 'pending', NOW() - INTERVAL '10 days')
       ON CONFLICT DO NOTHING`,
      [app5Id]
    );

    console.log("  ✅ Tasks seeded");

    await client.query("COMMIT");
    console.log("\n🎉 Seed complete!");
    console.log("   Login credentials for all seeded users: password123");
    console.log("   Students: rahul@student.edu, priya@student.edu");
    console.log("   Companies: hr@infosys.com, hr@tcs.com");
    console.log("   Coordinator: coordinator@college.edu");
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
