import dotenv from "dotenv";
dotenv.config();

export const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Access denied, you are not admin" });
  }
  next();
};
