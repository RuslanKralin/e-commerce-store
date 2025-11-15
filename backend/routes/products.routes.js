import express from "express";
import {
  createProduct,
  getAllProducts,
  getFeaturedProducts,
  deleteProduct,
  getRecommendProduct,
  getProductsByCategory,
  toggleFeaturedProduct,
} from "../controllers/products.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { adminMiddleware } from "../middleware/admin.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, getAllProducts);
router.post("/", authMiddleware, adminMiddleware, createProduct);
router.patch("/:id", authMiddleware, adminMiddleware, toggleFeaturedProduct);
router.get("/featured", authMiddleware, adminMiddleware, getFeaturedProducts);
router.get(
  "/category/:category",
  authMiddleware,
  adminMiddleware,
  getProductsByCategory
);
router.put(
  "/recommendations",
  authMiddleware,
  adminMiddleware,
  getRecommendProduct
);
router.delete("/:id", authMiddleware, adminMiddleware, deleteProduct);

export default router;

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDcwNzU3NzUyNWZhMTU5OTViODBhOSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc2MjA3NjQ2MCwiZXhwIjoxNzYyMDc3MzYwfQ.dFzq9-HeXZmbr-4z3plWmIxUH8n4DFquc4XFTMI24Zo
