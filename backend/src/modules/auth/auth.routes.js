import { Router } from "express";
import {
  studentRegister,
  studentLogin,
  coordinatorRegister,
  coordinatorLogin,
  companyRegister,
  companyLogin,
  getMe,
} from "./auth.controller.js";
import { protect } from "../../shared/middlewares/authMiddleware.js";

const router = Router();

// Student auth
router.post("/students/register", studentRegister);
router.post("/students/login", studentLogin);

// Coordinator auth
router.post("/coordinators/register", coordinatorRegister);
router.post("/coordinators/login", coordinatorLogin);

// Company auth
router.post("/companies/register", companyRegister);
router.post("/companies/login", companyLogin);

// Get own profile
router.get("/me", protect, getMe);

export default router;
