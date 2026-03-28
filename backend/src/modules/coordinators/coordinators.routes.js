import { Router } from "express";
import { protect, roleGuard } from "../../shared/middlewares/authMiddleware.js";
import {
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
  getCompanies,
  getCompany,
  getApplications,
  getApplicationDetail,
  updateApplicationStatus,
  getReportsSummary,
} from "./coordinators.controller.js";

const router = Router();

router.use(protect, roleGuard("coordinator"));

router.get("/students", getStudents);
router.get("/students/:id", getStudent);
router.put("/students/:id", updateStudent);
router.delete("/students/:id", deleteStudent);

router.get("/companies", getCompanies);
router.get("/companies/:id", getCompany);

router.get("/applications", getApplications);
router.get("/applications/:id", getApplicationDetail);
router.put("/applications/:id/status", updateApplicationStatus);

router.get("/reports/summary", getReportsSummary);

export default router;
