import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { adminMiddleware } from "../middleware/admin.middleware.js";
import {
  createCoupon,
  validateCoupon,
} from "../controllers/coupon.controller.js";
import { getCoupon } from "../controllers/coupon.controller.js";

const router = express.Router();

// router.post("/", authMiddleware, adminMiddleware, createCoupon);
router.get("/", authMiddleware, getCoupon);
router.get("/validate", authMiddleware, validateCoupon);

export default router;
