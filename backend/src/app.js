import express from "express";
import cors from "cors";
import morgan from "morgan";
import { ENV } from "./env.js";
import errorHandler from "./shared/middlewares/errorHandler.js";

// ── Route Imports ───────────────────────────────────────────────────
import authRoutes from "./modules/auth/auth.routes.js";
import studentRoutes from "./modules/students/students.routes.js";
import companyRoutes from "./modules/companies/companies.routes.js";
import internshipRoutes from "./modules/internships/internships.routes.js";
import jobRoutes from "./modules/jobs/jobs.routes.js";
import applicationRoutes from "./modules/applications/applications.routes.js";
import interviewRoutes from "./modules/interviews/interviews.routes.js";
import offerRoutes from "./modules/offers/offers.routes.js";
import onboardingRoutes from "./modules/onboarding/onboarding.routes.js";
import coordinatorRoutes from "./modules/coordinators/coordinators.routes.js";

const app = express();

// ── Middleware ──────────────────────────────────────────────────────
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// ── Serve uploaded files ────────────────────────────────────────────
app.use("/uploads", express.static(ENV.UPLOAD_DIR));

// ── Health Check ────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is up and running 🚀",
    timestamp: new Date().toISOString(),
  });
});

// ── Feature Routes ──────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/internships", internshipRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/coordinators", coordinatorRoutes);

// ── 404 Handler ─────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Global Error Handler (must be last) ─────────────────────────────
app.use(errorHandler);

export default app;
