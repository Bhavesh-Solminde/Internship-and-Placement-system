import { Router } from "express";
import { protect, roleGuard } from "../../shared/middlewares/authMiddleware.js";
import { createOffer, getByApplication, acceptOffer, rejectOffer, updateOffer } from "./offers.controller.js";

const router = Router();

router.post("/", protect, roleGuard("company", "coordinator"), createOffer);
router.get("/application/:applicationId", protect, getByApplication);
router.put("/:id/accept", protect, roleGuard("student"), acceptOffer);
router.put("/:id/reject", protect, roleGuard("student"), rejectOffer);
router.put("/:id", protect, roleGuard("company", "coordinator"), updateOffer);

export default router;
