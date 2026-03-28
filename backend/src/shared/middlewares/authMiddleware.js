import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ENV } from "../../env.js";

/**
 * protect — Verifies JWT from Authorization header and attaches
 * decoded payload to req.user.
 *   req.user = { id, role }  (e.g. { id: <uuid>, role: 'student' })
 */
export const protect = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "No token provided");
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    throw new ApiError(401, "Invalid or expired token");
  }
});

/**
 * roleGuard — Restricts access to specific roles.
 * Usage: router.get("/admin-only", protect, roleGuard("coordinator"), handler)
 */
export const roleGuard = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw new ApiError(403, "Access forbidden for your role");
  }
  next();
};
