import { Router } from "express";
import { protect, roleGuard } from "../../shared/middlewares/authMiddleware.js";
import {
  getProfile,
  updateProfile,
  getInternships,
  getJobs,
  getInternshipApplicants,
  getJobApplicants,
  updateApplicationStatus,
} from "./companies.controller.js";

const router = Router();

router.use(protect, roleGuard("company"));

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.get("/internships", getInternships);
router.get("/jobs", getJobs);
router.get("/internships/:id/applicants", getInternshipApplicants);
router.get("/jobs/:id/applicants", getJobApplicants);
router.put("/applications/:appId/status", updateApplicationStatus);

export default router;
