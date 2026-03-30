-- ═══════════════════════════════════════════════════════════════════════
-- SmartNiyukti Seed Data
-- Password for all demo users: password123
-- Hash generated with bcrypt (10 rounds)
-- ═══════════════════════════════════════════════════════════════════════

-- Hash for 'password123'
-- $2b$10$QdwlipwDNHdFcEaD5V/KwOcb5yVu/w1ldMs3iZrc2YW.zv2sYN7kC

-- ─── Coordinators ─────────────────────────────────────────────────────
INSERT INTO coordinators (coordinator_id, name, email, phone, password_hash) VALUES
  ('c0000001-0000-0000-0000-000000000001', 'Dr. Meera Sharma', 'coordinator@college.edu', '9876543210', '$2b$10$QdwlipwDNHdFcEaD5V/KwOcb5yVu/w1ldMs3iZrc2YW.zv2sYN7kC'),
  ('c0000001-0000-0000-0000-000000000002', 'Prof. Amit Patel', 'amit.patel@college.edu', '9876543211', '$2b$10$QdwlipwDNHdFcEaD5V/KwOcb5yVu/w1ldMs3iZrc2YW.zv2sYN7kC'),
  ('c0000001-0000-0000-0000-000000000003', 'Dr. Priya Desai', 'priya.desai@college.edu', '9876543212', '$2b$10$QdwlipwDNHdFcEaD5V/KwOcb5yVu/w1ldMs3iZrc2YW.zv2sYN7kC')
ON CONFLICT (email) DO NOTHING;

-- ─── Companies ────────────────────────────────────────────────────────
INSERT INTO companies (company_id, name, industry, location, contact_email, password_hash, coordinator_id, website) VALUES
  ('d0000001-0000-0000-0000-000000000001', 'Infosys', 'IT Services', 'Bengaluru', 'hr@infosys.com', '$2b$10$QdwlipwDNHdFcEaD5V/KwOcb5yVu/w1ldMs3iZrc2YW.zv2sYN7kC', 'c0000001-0000-0000-0000-000000000001', 'https://infosys.com'),
  ('d0000001-0000-0000-0000-000000000002', 'TCS', 'IT Services', 'Mumbai', 'hr@tcs.com', '$2b$10$QdwlipwDNHdFcEaD5V/KwOcb5yVu/w1ldMs3iZrc2YW.zv2sYN7kC', 'c0000001-0000-0000-0000-000000000001', 'https://tcs.com'),
  ('d0000001-0000-0000-0000-000000000003', 'Wipro', 'IT Services', 'Pune', 'hr@wipro.com', '$2b$10$QdwlipwDNHdFcEaD5V/KwOcb5yVu/w1ldMs3iZrc2YW.zv2sYN7kC', 'c0000001-0000-0000-0000-000000000002', 'https://wipro.com'),
  ('d0000001-0000-0000-0000-000000000004', 'Razorpay', 'FinTech', 'Bengaluru', 'hr@razorpay.com', '$2b$10$QdwlipwDNHdFcEaD5V/KwOcb5yVu/w1ldMs3iZrc2YW.zv2sYN7kC', 'c0000001-0000-0000-0000-000000000002', 'https://razorpay.com'),
  ('d0000001-0000-0000-0000-000000000005', 'Zoho', 'SaaS', 'Chennai', 'hr@zoho.com', '$2b$10$QdwlipwDNHdFcEaD5V/KwOcb5yVu/w1ldMs3iZrc2YW.zv2sYN7kC', 'c0000001-0000-0000-0000-000000000003', 'https://zoho.com')
ON CONFLICT (contact_email) DO NOTHING;

-- ─── Students ─────────────────────────────────────────────────────────
INSERT INTO students (student_id, name, email, phone, password_hash, cgpa, coordinator_id, skills, experience_years, location, linkedin_url, github_url, education, experience, projects) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Rahul Kumar', 'rahul@student.edu', '9000000001', '$2b$10$QdwlipwDNHdFcEaD5V/KwOcb5yVu/w1ldMs3iZrc2YW.zv2sYN7kC', 8.5, 'c0000001-0000-0000-0000-000000000001',
   ARRAY['React', 'Node.js', 'PostgreSQL', 'JavaScript', 'Git'], 1.5, 'Mumbai',
   'https://linkedin.com/in/rahulk', 'https://github.com/rahulk',
   '[{"degree":"B.Tech","institution":"IIT Bombay","field":"Computer Science","from_year":"2020","to_year":"2024"}]'::jsonb,
   '[{"title":"Frontend Intern","company":"Startup XYZ","start":"Jun 2023","end":"Aug 2023","description":"Built React dashboard","is_current":false}]'::jsonb,
   '[{"name":"TaskFlow","tech":"React, Node.js, PostgreSQL","description":"Full-stack task management app","url":"https://github.com/rahulk/taskflow"}]'::jsonb),

  ('a0000001-0000-0000-0000-000000000002', 'Priya Singh', 'priya@student.edu', '9000000002', '$2b$10$QdwlipwDNHdFcEaD5V/KwOcb5yVu/w1ldMs3iZrc2YW.zv2sYN7kC', 9.1, 'c0000001-0000-0000-0000-000000000001',
   ARRAY['Python', 'Machine Learning', 'TensorFlow', 'SQL', 'Data Analysis'], 2.0, 'Delhi',
   'https://linkedin.com/in/priyas', 'https://github.com/priyas',
   '[{"degree":"M.Tech","institution":"IIT Delhi","field":"AI & ML","from_year":"2022","to_year":"2024"},{"degree":"B.Tech","institution":"NIT Trichy","field":"CSE","from_year":"2018","to_year":"2022"}]'::jsonb,
   '[{"title":"ML Research Intern","company":"Google","start":"May 2023","end":"Jul 2023","description":"NLP research project","is_current":false}]'::jsonb,
   '[{"name":"SentimentBot","tech":"Python, BERT, Flask","description":"Real-time sentiment analysis chatbot","url":""}]'::jsonb),

  ('a0000001-0000-0000-0000-000000000003', 'Arjun Mehta', 'arjun@student.edu', '9000000003', '$2b$10$QdwlipwDNHdFcEaD5V/KwOcb5yVu/w1ldMs3iZrc2YW.zv2sYN7kC', 7.8, 'c0000001-0000-0000-0000-000000000002',
   ARRAY['Java', 'Spring Boot', 'React', 'Docker', 'AWS'], 0.5, 'Bengaluru',
   'https://linkedin.com/in/arjunm', NULL,
   '[{"degree":"B.E.","institution":"BMS College Bengaluru","field":"Information Science","from_year":"2020","to_year":"2024"}]'::jsonb,
   '[]'::jsonb,
   '[{"name":"EShop","tech":"Spring Boot, React","description":"E-commerce platform","url":"https://github.com/arjunm/eshop"}]'::jsonb),

  ('a0000001-0000-0000-0000-000000000004', 'Sneha Gupta', 'sneha@student.edu', '9000000004', '$2b$10$QdwlipwDNHdFcEaD5V/KwOcb5yVu/w1ldMs3iZrc2YW.zv2sYN7kC', 8.9, 'c0000001-0000-0000-0000-000000000002',
   ARRAY['UI/UX', 'Figma', 'React', 'CSS', 'JavaScript'], 1.0, 'Pune',
   NULL, 'https://github.com/snehag',
   '[{"degree":"B.Des","institution":"NID Ahmedabad","field":"Interaction Design","from_year":"2020","to_year":"2024"}]'::jsonb,
   '[{"title":"UX Design Intern","company":"Flipkart","start":"Jan 2024","end":"Mar 2024","description":"Redesigned checkout flow","is_current":false}]'::jsonb,
   '[{"name":"DesignKit","tech":"Figma, React","description":"Open-source UI component library","url":""}]'::jsonb),

  ('a0000001-0000-0000-0000-000000000005', 'Vikram Reddy', 'vikram@student.edu', '9000000005', '$2b$10$QdwlipwDNHdFcEaD5V/KwOcb5yVu/w1ldMs3iZrc2YW.zv2sYN7kC', 7.2, 'c0000001-0000-0000-0000-000000000001',
   ARRAY['Android', 'Kotlin', 'Firebase', 'Java'], 0, 'Hyderabad',
   NULL, NULL,
   '[{"degree":"B.Tech","institution":"JNTU Hyderabad","field":"CSE","from_year":"2021","to_year":"2025"}]'::jsonb, '[]'::jsonb, '[]'::jsonb),

  ('a0000001-0000-0000-0000-000000000006', 'Ananya Iyer', 'ananya@student.edu', '9000000006', '$2b$10$QdwlipwDNHdFcEaD5V/KwOcb5yVu/w1ldMs3iZrc2YW.zv2sYN7kC', 8.3, 'c0000001-0000-0000-0000-000000000003',
   ARRAY['Python', 'Django', 'PostgreSQL', 'Docker', 'REST APIs'], 1.5, 'Chennai',
   'https://linkedin.com/in/ananyai', 'https://github.com/ananyai',
   '[{"degree":"B.Tech","institution":"Anna University","field":"IT","from_year":"2020","to_year":"2024"}]'::jsonb,
   '[{"title":"Backend Intern","company":"Zoho","start":"Jun 2023","end":"Dec 2023","description":"Built microservices","is_current":false}]'::jsonb,
   '[{"name":"BlogEngine","tech":"Django, PostgreSQL","description":"Multi-tenant blogging platform","url":""}]'::jsonb),

  ('a0000001-0000-0000-0000-000000000007', 'Rohan Joshi', 'rohan@student.edu', '9000000007', '$2b$10$QdwlipwDNHdFcEaD5V/KwOcb5yVu/w1ldMs3iZrc2YW.zv2sYN7kC', 6.8, 'c0000001-0000-0000-0000-000000000003',
   ARRAY['C++', 'Data Structures', 'Algorithms'], 0, 'Jaipur',
   NULL, NULL,
   '[{"degree":"B.Tech","institution":"MNIT Jaipur","field":"CSE","from_year":"2021","to_year":"2025"}]'::jsonb, '[]'::jsonb, '[]'::jsonb),

  ('a0000001-0000-0000-0000-000000000008', 'Kavya Nair', 'kavya@student.edu', '9000000008', '$2b$10$QdwlipwDNHdFcEaD5V/KwOcb5yVu/w1ldMs3iZrc2YW.zv2sYN7kC', 9.4, 'c0000001-0000-0000-0000-000000000001',
   ARRAY['React', 'TypeScript', 'Node.js', 'MongoDB', 'GraphQL', 'AWS'], 3.0, 'Kochi',
   'https://linkedin.com/in/kavyan', 'https://github.com/kavyan',
   '[{"degree":"M.Tech","institution":"IISc Bangalore","field":"Software Engineering","from_year":"2022","to_year":"2024"},{"degree":"B.Tech","institution":"CET Trivandrum","field":"CSE","from_year":"2018","to_year":"2022"}]'::jsonb,
   '[{"title":"Full-Stack Developer","company":"Freshworks","start":"Jul 2022","end":"May 2023","description":"Led frontend team","is_current":false},{"title":"SDE Intern","company":"Amazon","start":"May 2021","end":"Jul 2021","description":"Built internal tools","is_current":false}]'::jsonb,
   '[{"name":"DevHub","tech":"React, GraphQL, Node.js","description":"Developer collaboration platform","url":"https://github.com/kavyan/devhub"}]'::jsonb)

ON CONFLICT (email) DO NOTHING;

-- ─── Internships ──────────────────────────────────────────────────────
INSERT INTO internships (internship_id, title, stipend, duration, description, company_id, required_experience_years, deadline, status) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'React Frontend Intern', 15000, '3 months', 'Build responsive UIs with React and Tailwind CSS. You will work with the product team on their customer-facing dashboard.', 'd0000001-0000-0000-0000-000000000001', 0, '2026-05-15', 'open'),
  ('b0000001-0000-0000-0000-000000000002', 'Data Science Intern', 25000, '6 months', 'Work on ML models for customer segmentation using Python, TensorFlow, and SQL.', 'd0000001-0000-0000-0000-000000000002', 1, '2026-04-30', 'open'),
  ('b0000001-0000-0000-0000-000000000003', 'Backend Development Intern', 20000, '4 months', 'Build RESTful APIs with Node.js and PostgreSQL. Experience with Docker is a plus.', 'd0000001-0000-0000-0000-000000000003', 0, '2026-06-01', 'open'),
  ('b0000001-0000-0000-0000-000000000004', 'UI/UX Design Intern', 18000, '3 months', 'Design intuitive interfaces using Figma. Collaborate with developers to ship pixel-perfect UIs.', 'd0000001-0000-0000-0000-000000000004', 0, '2026-04-20', 'open'),
  ('b0000001-0000-0000-0000-000000000005', 'DevOps Intern', 22000, '5 months', 'Work with Docker, Kubernetes, and AWS to manage CI/CD pipelines and cloud infrastructure.', 'd0000001-0000-0000-0000-000000000005', 0.5, '2026-05-01', 'open'),
  ('b0000001-0000-0000-0000-000000000006', 'Mobile App Intern', 12000, '3 months', 'Build Android apps using Kotlin and Firebase. Knowledge of material design required.', 'd0000001-0000-0000-0000-000000000001', 0, '2026-03-01', 'open')
ON CONFLICT (internship_id) DO NOTHING;

-- ─── Jobs ─────────────────────────────────────────────────────────────
INSERT INTO jobs (job_id, job_title, salary, location, description, company_id, required_experience_years, deadline, status) VALUES
  ('e0000001-0000-0000-0000-000000000001', 'Senior Software Engineer', 1800000, 'Bengaluru', 'Lead development of microservices architecture. 3+ years experience with React and Node.js required.', 'd0000001-0000-0000-0000-000000000001', 3, '2026-06-30', 'open'),
  ('e0000001-0000-0000-0000-000000000002', 'Data Analyst', 900000, 'Mumbai', 'Analyze business data and create dashboards using Python, SQL, and Tableau. Strong communication skills needed.', 'd0000001-0000-0000-0000-000000000002', 1, '2026-05-15', 'open'),
  ('e0000001-0000-0000-0000-000000000003', 'Full Stack Developer', 1200000, 'Pune', 'Build end-to-end features with React, Django, and PostgreSQL. Remote-friendly.', 'd0000001-0000-0000-0000-000000000003', 2, '2026-07-01', 'open'),
  ('e0000001-0000-0000-0000-000000000004', 'Product Designer', 1500000, 'Bengaluru', 'Own the design system and drive product UX. Experience with Figma and user research required.', 'd0000001-0000-0000-0000-000000000004', 2, '2026-05-30', 'open')
ON CONFLICT (job_id) DO NOTHING;

-- ─── Applications ─────────────────────────────────────────────────────
INSERT INTO applications (application_id, student_id, internship_id, job_id, application_type, status, apply_date) VALUES
  -- Rahul: applied to 3 things
  ('f0000001-0000-0000-0000-000000000001', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', NULL, 'internship', 'shortlisted', '2026-03-01'),
  ('f0000001-0000-0000-0000-000000000002', 'a0000001-0000-0000-0000-000000000001', NULL, 'e0000001-0000-0000-0000-000000000003', 'job', 'pending', '2026-03-10'),
  ('f0000001-0000-0000-0000-000000000003', 'a0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000003', NULL, 'internship', 'pending', '2026-03-15'),

  -- Priya: applied to 2 things
  ('f0000001-0000-0000-0000-000000000004', 'a0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000002', NULL, 'internship', 'offered', '2026-03-02'),
  ('f0000001-0000-0000-0000-000000000005', 'a0000001-0000-0000-0000-000000000002', NULL, 'e0000001-0000-0000-0000-000000000002', 'job', 'shortlisted', '2026-03-05'),

  -- Arjun: applied to 2
  ('f0000001-0000-0000-0000-000000000006', 'a0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000001', NULL, 'internship', 'pending', '2026-03-08'),
  ('f0000001-0000-0000-0000-000000000007', 'a0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000003', NULL, 'internship', 'rejected', '2026-03-12'),

  -- Sneha: applied to design roles
  ('f0000001-0000-0000-0000-000000000008', 'a0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000004', NULL, 'internship', 'accepted', '2026-02-28'),
  ('f0000001-0000-0000-0000-000000000009', 'a0000001-0000-0000-0000-000000000004', NULL, 'e0000001-0000-0000-0000-000000000004', 'job', 'offered', '2026-03-03'),

  -- Ananya
  ('f0000001-0000-0000-0000-000000000010', 'a0000001-0000-0000-0000-000000000006', 'b0000001-0000-0000-0000-000000000003', NULL, 'internship', 'shortlisted', '2026-03-04'),
  ('f0000001-0000-0000-0000-000000000011', 'a0000001-0000-0000-0000-000000000006', NULL, 'e0000001-0000-0000-0000-000000000003', 'job', 'pending', '2026-03-20'),

  -- Kavya
  ('f0000001-0000-0000-0000-000000000012', 'a0000001-0000-0000-0000-000000000008', NULL, 'e0000001-0000-0000-0000-000000000001', 'job', 'shortlisted', '2026-03-01'),
  ('f0000001-0000-0000-0000-000000000013', 'a0000001-0000-0000-0000-000000000008', 'b0000001-0000-0000-0000-000000000001', NULL, 'internship', 'offered', '2026-03-02'),

  -- Vikram
  ('f0000001-0000-0000-0000-000000000014', 'a0000001-0000-0000-0000-000000000005', 'b0000001-0000-0000-0000-000000000006', NULL, 'internship', 'pending', '2026-03-18'),

  -- Rohan  
  ('f0000001-0000-0000-0000-000000000015', 'a0000001-0000-0000-0000-000000000007', 'b0000001-0000-0000-0000-000000000005', NULL, 'internship', 'rejected', '2026-03-10')
ON CONFLICT DO NOTHING;

-- ─── Interviews ───────────────────────────────────────────────────────
INSERT INTO interviews (interview_id, application_id, date, round, mode, result, notes) VALUES
  ('10000001-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000001', '2026-03-15 10:00:00', 'Technical', 'online', 'passed', 'Candidate showed strong React knowledge. Good problem-solving approach.'),
  ('10000001-0000-0000-0000-000000000002', 'f0000001-0000-0000-0000-000000000004', '2026-03-12 14:00:00', 'Technical', 'online', 'passed', 'Excellent ML understanding. Published research on NLP was a plus.'),
  ('10000001-0000-0000-0000-000000000003', 'f0000001-0000-0000-0000-000000000004', '2026-03-18 11:00:00', 'HR', 'telephonic', 'passed', 'Great communication. Salary expectations aligned.'),
  ('10000001-0000-0000-0000-000000000004', 'f0000001-0000-0000-0000-000000000008', '2026-03-10 09:30:00', 'Design Challenge', 'offline', 'passed', 'Outstanding portfolio. Clean design sensibility.'),
  ('10000001-0000-0000-0000-000000000005', 'f0000001-0000-0000-0000-000000000012', '2026-03-20 15:00:00', 'System Design', 'online', 'pending', 'Scheduled for next week. Focus on distributed systems.')
ON CONFLICT (interview_id) DO NOTHING;

-- ─── Offers ───────────────────────────────────────────────────────────
INSERT INTO offers (offer_id, application_id, offer_letter_url, status, deadline) VALUES
  ('20000001-0000-0000-0000-000000000001', 'f0000001-0000-0000-0000-000000000004', 'https://docs.google.com/document/d/demo-offer-tcs', 'pending', '2026-04-15'),
  ('20000001-0000-0000-0000-000000000002', 'f0000001-0000-0000-0000-000000000008', 'https://drive.google.com/file/d/sneha-offer-razorpay', 'accepted', '2026-04-10'),
  ('20000001-0000-0000-0000-000000000003', 'f0000001-0000-0000-0000-000000000009', NULL, 'pending', '2026-04-20'),
  ('20000001-0000-0000-0000-000000000004', 'f0000001-0000-0000-0000-000000000013', 'https://example.com/offers/kavya-infosys.pdf', 'pending', '2026-04-25')
ON CONFLICT (offer_id) DO NOTHING;
