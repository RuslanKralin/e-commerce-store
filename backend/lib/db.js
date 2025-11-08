import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

export const connectDB = async () => {
  try {
    const connection = await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB connected", connection.connection.host);
  } catch (error) {
    console.log("MongoDB connection error", error);
    process.exit(1);
  }
};
