import { Router } from "express";
import { protect } from "../../shared/middlewares/authMiddleware.js";
import { getThreads, getMessages, markRead } from "./chat.controller.js";

const router = Router();

// All chat routes require authentication (students + companies both access)
router.use(protect);

router.get("/threads", getThreads);
router.get("/:applicationId/messages", getMessages);
router.put("/:applicationId/read", markRead);

export default router;
