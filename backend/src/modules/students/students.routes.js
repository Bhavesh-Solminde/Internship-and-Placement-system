import { Router } from "express";
import { protect, roleGuard } from "../../shared/middlewares/authMiddleware.js";
import upload from "../../shared/middlewares/upload.js";
import {
  getProfile,
  updateProfile,
  uploadResume,
  getApplications,
  getApplication,
  getDashboard,
} from "./students.controller.js";

const router = Router();

router.use(protect, roleGuard("student"));

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.post("/resume/upload", upload.single("resume"), uploadResume);
router.get("/applications", getApplications);
router.get("/applications/:id", getApplication);
router.get("/dashboard", getDashboard);

export default router;
