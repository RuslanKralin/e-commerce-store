import express from "express";

import {
  addToCart,
  getCartProducts,
  removeAllFromCart,
  updateQuantity,
} from "../controllers/cart.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", authMiddleware, addToCart);
router.get("/", authMiddleware, getCartProducts);
router.delete("/", authMiddleware, removeAllFromCart);
router.put("/:productId", authMiddleware, updateQuantity);

export default router;
