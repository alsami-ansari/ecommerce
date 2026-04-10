import Coupon from '../models/couponModel.js';

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Private/Admin
export const createCoupon = async (req, res) => {
  try {
    const { code, discountType, discountValue, expiryDate, minOrderValue } = req.body;
    const couponExists = await Coupon.findOne({ code: code.toUpperCase() });

    if (couponExists) {
      return res.status(400).json({ message: 'Coupon code already exists' });
    }

    const coupon = await Coupon.create({
      code, discountType, discountValue, expiryDate, minOrderValue,
    });
    res.status(201).json(coupon);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating coupon' });
  }
};

// @desc    Get all coupons
// @route   GET /api/coupons
// @access  Private/Admin
export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({});
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching coupons' });
  }
};

// @desc    Apply a coupon to get a discount
// @route   POST /api/coupons/apply
// @access  Private (Any logged-in user)
export const applyCoupon = async (req, res) => {
  try {
    const { code, orderValue } = req.body;
    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid or inactive coupon' });
    }

    if (new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({ message: 'Coupon has expired' });
    }

    if (orderValue < coupon.minOrderValue) {
      return res.status(400).json({ message: `Minimum order value for this coupon is $${coupon.minOrderValue}` });
    }

    // Calculate the final discount amount based on percentage or fixed value
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (orderValue * coupon.discountValue) / 100;
    } else {
      discountAmount = coupon.discountValue;
    }

    res.json({ discountAmount, code: coupon.code });
  } catch (error) {
    res.status(500).json({ message: 'Server error applying coupon' });
  }
};
