import { Router } from "express";
import { protect, roleGuard } from "../../shared/middlewares/authMiddleware.js";
import { createInterview, getByApplication, updateInterview, deleteInterview } from "./interviews.controller.js";

const router = Router();

router.post("/", protect, roleGuard("company", "coordinator"), createInterview);
router.get("/application/:applicationId", protect, getByApplication);
router.put("/:id", protect, roleGuard("company", "coordinator"), updateInterview);
router.delete("/:id", protect, roleGuard("company", "coordinator"), deleteInterview);

export default router;
