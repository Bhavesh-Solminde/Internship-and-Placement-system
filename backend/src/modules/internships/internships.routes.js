import { Router } from "express";
import { protect, roleGuard } from "../../shared/middlewares/authMiddleware.js";
import {
  listInternships,
  getInternship,
  createInternship,
  updateInternship,
  deleteInternship,
  applyToInternship,
} from "./internships.controller.js";

const router = Router();

// Public
router.get("/", listInternships);
router.get("/:id", getInternship);

// Company only
router.post("/", protect, roleGuard("company"), createInternship);
router.put("/:id", protect, roleGuard("company"), updateInternship);
router.delete("/:id", protect, roleGuard("company"), deleteInternship);

// Student only
router.post("/:id/apply", protect, roleGuard("student"), applyToInternship);

export default router;
