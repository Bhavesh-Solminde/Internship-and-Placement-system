import { Router } from "express";
import { protect, roleGuard } from "../../shared/middlewares/authMiddleware.js";
import { createOnboarding, getByOffer, updateOnboarding } from "./onboarding.controller.js";

const router = Router();

router.post("/", protect, roleGuard("coordinator", "company"), createOnboarding);
router.get("/offer/:offerId", protect, getByOffer);
router.put("/:id", protect, roleGuard("coordinator"), updateOnboarding);

export default router;
