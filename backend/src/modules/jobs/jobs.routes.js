import { Router } from "express";
import { protect, roleGuard } from "../../shared/middlewares/authMiddleware.js";
import {
  listJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  applyToJob,
} from "./jobs.controller.js";

const router = Router();

router.get("/", listJobs);
router.get("/:id", getJob);
router.post("/", protect, roleGuard("company"), createJob);
router.put("/:id", protect, roleGuard("company"), updateJob);
router.delete("/:id", protect, roleGuard("company"), deleteJob);
router.post("/:id/apply", protect, roleGuard("student"), applyToJob);

export default router;
