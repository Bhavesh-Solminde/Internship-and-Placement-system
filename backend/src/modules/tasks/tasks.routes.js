import { Router } from "express";
import { protect, roleGuard } from "../../shared/middlewares/authMiddleware.js";
import submissionUpload from "../../shared/middlewares/submissionUpload.js";
import { createTask, getTasksByApplication, completeTask, updateApplicationStatus } from "./tasks.controller.js";

const router = Router();

router.use(protect);

router.post("/", roleGuard("company"), createTask);
router.get("/:applicationId", getTasksByApplication);
router.put("/:taskId/complete", roleGuard("student"), submissionUpload.single("file"), completeTask);

// Application status update (company only — Change 2)
router.patch("/applications/:applicationId/status", roleGuard("company"), updateApplicationStatus);

export default router;
