import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      // код купона
      type: String,
      required: true,
      unique: true,
    },
    discountPercentage: {
      // процент скидки
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    expirationDate: {
      // дата истечения срока действия купона
      type: Date,
      required: true,
    },
    isActive: {
      // статус купона
      type: Boolean,
      default: true,
    },
    userId: {
      // id пользователя этим купоном
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;
