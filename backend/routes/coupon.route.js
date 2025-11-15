import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";

import { validateCoupon, getCoupon } from "../controllers/coupon.controller.js";

const router = express.Router();

router.get("/", authMiddleware, getCoupon);
router.get("/validate", authMiddleware, validateCoupon);

export default router;
