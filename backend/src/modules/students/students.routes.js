import { Router } from "express";
import { protect, roleGuard } from "../../shared/middlewares/authMiddleware.js";
import upload from "../../shared/middlewares/upload.js";
import {
  getProfile, updateProfile, uploadResume, parseResume,
  getApplications, getApplication, getDashboard, getMatches, getAppliedIds,
} from "./students.controller.js";

const router = Router();
router.use(protect, roleGuard("student"));

router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.post("/resume/upload", upload.single("resume"), uploadResume);
router.post("/resume/parse", upload.single("resume"), parseResume);
router.get("/applications", getApplications);
router.get("/applications/:id", getApplication);
router.get("/dashboard", getDashboard);
router.get("/matches", getMatches);
router.get("/applied-ids", getAppliedIds);

export default router;
