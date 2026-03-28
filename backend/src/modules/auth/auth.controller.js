import asyncHandler from "../../shared/utils/asyncHandler.js";
import { ApiResponse, ApiError } from "../../shared/utils/apiResponse.js";
import pool from "../../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ENV } from "../../env.js";

// ─── Helper: sign JWT ─────────────────────────────────────────────────
const signToken = (id, role) =>
  jwt.sign({ id, role }, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES_IN });

// ─── Student Register ─────────────────────────────────────────────────
export const studentRegister = asyncHandler(async (req, res) => {
  const { name, email, phone, password, gpa, coordinator_id, skills } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const { rows } = await pool.query(
    `INSERT INTO students (name, email, phone, password_hash, gpa, coordinator_id, skills)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING student_id, name, email, phone, gpa, skills, created_at`,
    [name, email, phone || null, passwordHash, gpa || null, coordinator_id || null, skills || null]
  );

  const student = rows[0];
  const token = signToken(student.student_id, "student");

  return res.status(201).json(
    new ApiResponse(201, { user: student, token, role: "student" }, "Student registered successfully")
  );
});

// ─── Student Login ────────────────────────────────────────────────────
export const studentLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const { rows } = await pool.query(
    `SELECT student_id, name, email, phone, gpa, skills, password_hash FROM students WHERE email = $1`,
    [email]
  );

  if (rows.length === 0) {
    throw new ApiError(401, "Invalid email or password");
  }

  const student = rows[0];
  const isMatch = await bcrypt.compare(password, student.password_hash);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signToken(student.student_id, "student");
  const { password_hash, ...userData } = student;

  return res.status(200).json(
    new ApiResponse(200, { user: userData, token, role: "student" }, "Login successful")
  );
});

// ─── Coordinator Register ─────────────────────────────────────────────
export const coordinatorRegister = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const { rows } = await pool.query(
    `INSERT INTO coordinators (name, email, phone, password_hash)
     VALUES ($1, $2, $3, $4)
     RETURNING coordinator_id, name, email, phone, created_at`,
    [name, email, phone || null, passwordHash]
  );

  const coordinator = rows[0];
  const token = signToken(coordinator.coordinator_id, "coordinator");

  return res.status(201).json(
    new ApiResponse(201, { user: coordinator, token, role: "coordinator" }, "Coordinator registered successfully")
  );
});

// ─── Coordinator Login ────────────────────────────────────────────────
export const coordinatorLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const { rows } = await pool.query(
    `SELECT coordinator_id, name, email, phone, password_hash FROM coordinators WHERE email = $1`,
    [email]
  );

  if (rows.length === 0) {
    throw new ApiError(401, "Invalid email or password");
  }

  const coordinator = rows[0];
  const isMatch = await bcrypt.compare(password, coordinator.password_hash);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signToken(coordinator.coordinator_id, "coordinator");
  const { password_hash, ...userData } = coordinator;

  return res.status(200).json(
    new ApiResponse(200, { user: userData, token, role: "coordinator" }, "Login successful")
  );
});

// ─── Company Register ─────────────────────────────────────────────────
export const companyRegister = asyncHandler(async (req, res) => {
  const { name, industry, location, contact_email, password, coordinator_id, website } = req.body;

  if (!name || !contact_email || !password) {
    throw new ApiError(400, "Name, contact email, and password are required");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const { rows } = await pool.query(
    `INSERT INTO companies (name, industry, location, contact_email, password_hash, coordinator_id, website)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING company_id, name, industry, location, contact_email, website, created_at`,
    [name, industry || null, location || null, contact_email, passwordHash, coordinator_id || null, website || null]
  );

  const company = rows[0];
  const token = signToken(company.company_id, "company");

  return res.status(201).json(
    new ApiResponse(201, { user: company, token, role: "company" }, "Company registered successfully")
  );
});

// ─── Company Login ────────────────────────────────────────────────────
export const companyLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const { rows } = await pool.query(
    `SELECT company_id, name, industry, location, contact_email, website, password_hash FROM companies WHERE contact_email = $1`,
    [email]
  );

  if (rows.length === 0) {
    throw new ApiError(401, "Invalid email or password");
  }

  const company = rows[0];
  const isMatch = await bcrypt.compare(password, company.password_hash);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signToken(company.company_id, "company");
  const { password_hash, ...userData } = company;

  return res.status(200).json(
    new ApiResponse(200, { user: userData, token, role: "company" }, "Login successful")
  );
});

// ─── Get Me (self profile by token role) ──────────────────────────────
export const getMe = asyncHandler(async (req, res) => {
  const { id, role } = req.user;
  let query, idCol;

  if (role === "student") {
    idCol = "student_id";
    query = `SELECT student_id, name, email, phone, gpa, skills, resume_url, coordinator_id, created_at FROM students WHERE student_id = $1`;
  } else if (role === "coordinator") {
    idCol = "coordinator_id";
    query = `SELECT coordinator_id, name, email, phone, created_at FROM coordinators WHERE coordinator_id = $1`;
  } else if (role === "company") {
    idCol = "company_id";
    query = `SELECT company_id, name, industry, location, contact_email, website, created_at FROM companies WHERE company_id = $1`;
  } else {
    throw new ApiError(400, "Unknown role");
  }

  const { rows } = await pool.query(query, [id]);
  if (rows.length === 0) {
    throw new ApiError(404, "User not found");
  }

  return res.status(200).json(
    new ApiResponse(200, { user: rows[0], role }, "Profile fetched")
  );
});
