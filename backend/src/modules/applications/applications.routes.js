import { Router } from "express";
import { protect, roleGuard } from "../../shared/middlewares/authMiddleware.js";
import { getApplication, withdrawApplication, updateStatus } from "./applications.controller.js";

const router = Router();

router.get("/:id", protect, getApplication);
router.put("/:id/withdraw", protect, roleGuard("student"), withdrawApplication);
router.put("/:id/status", protect, roleGuard("company", "coordinator"), updateStatus);

export default router;
