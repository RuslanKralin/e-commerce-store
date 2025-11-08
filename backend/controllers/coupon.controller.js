import Coupon from "../models/coupon.model.js";

export const createCoupon = async (req, res) => {
  try {
    const { name, code, discount } = req.body;
    const coupon = await Coupon.create({ name, code, discount });
    res.status(201).json(coupon);
  } catch (error) {
    console.log("ошибка в createCoupon контроллере", error);
    res.status(500).json({ message: error.message });
  }
};

export const getCoupon = async (req, res) => {
  try {
    const coupons = await Coupon.find({ user: req.user._id, isActive: true });
    res.status(200).json(coupons || null);
  } catch (error) {
    console.log("ошибка в getCoupons контроллере", error);
    res.status(500).json({ message: error.message });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const { code } = req.body;
    const coupon = await Coupon.findOne({
      code,
      isActive: true,
      user: req.user._id,
    });
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }
    if (coupon.expiryDate < Date.now()) {
      coupon.isActive = false;
      await coupon.save();
      return res.status(400).json({ message: "Coupon expired" });
    }
    res.status(200).json({
      message: "Coupon validated successfully",
      code: coupon.code,
      discount: coupon.discount,
    });
  } catch (error) {
    console.log("ошибка в validateCoupon контроллере", error);
    res.status(500).json({ message: error.message });
  }
};
