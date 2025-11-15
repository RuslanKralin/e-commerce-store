import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { adminMiddleware } from "../middleware/admin.middleware.js";
import { getAllAnalytics } from "../controllers/analytics.controller.js";

const router = express.Router();

router.get("/", authMiddleware, adminMiddleware, getAllAnalytics);

export default router;
