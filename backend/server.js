import express from "express";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import cors from "cors";
import cookieParser from "cookie-parser";

import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.routes.js";
import productsRoutes from "./routes/products.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import couponRoutes from "./routes/coupon.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();

app.use(
  cors({
    credentials: true,
    optionsSuccessStatus: 200, // для старых браузеров
    origin: ["http://localhost:5173", "http://мой продакшн домен"],
  })
);

// пример запроса на бэк с фронтенда
// fetch('http://ваш-бэкенд/api/данные', {
//   method: 'GET',
//   credentials: 'include', // важно для кук
//   headers: {
//     'Content-Type': 'application/json',
//     'Authorization': `Bearer ${вашТокен}`
//   }
// })

// Базовый лимит для всех запросов
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  standardHeaders: true, // Возвращает информацию об ограничениях в заголовках
  legacyHeaders: false, // Отключает устаревшие заголовки
  message: "Слишком много запросов с вашего IP, попробуйте позже",
});

app.use(apiLimiter);

app.use(express.json());

app.use(cookieParser()); // чтоб достать refreshToken из cookie

app.use(cors());

app.use("/api/auth", apiLimiter, authRoutes);
app.use("/api/products", apiLimiter, productsRoutes);
app.use("/api/cart", apiLimiter, cartRoutes);
app.use("/api/coupons", apiLimiter, couponRoutes);
app.use("/api/payment", apiLimiter, paymentRoutes);
app.use("/api/analytics", apiLimiter, analyticsRoutes);

app.listen(PORT, () => {
  connectDB();
  console.log(`Server running on port ${PORT}`);
});
