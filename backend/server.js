import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./lib/db.js";
import authRoute from "./routes/auth.route.js";
import productsRoute from "./routes/products.route.js";
import cartRoute from "./routes/cart.route.js";
import couponsRoute from "./routes/coupon.route.js";
import cookieParser from "cookie-parser";

dotenv.config();

const PORT = process.env.PORT || 5000;

const app = express();

app.use(express.json());

app.use(cookieParser()); // чтоб достать refreshToken из cookie

app.use("/api/auth", authRoute);
app.use("/api/products", productsRoute);
app.use("/api/cart", cartRoute);
app.use("/api/coupons", couponsRoute);

app.listen(PORT, () => {
  connectDB();
  console.log(`Server running on port ${PORT}`);
});
