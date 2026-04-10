import express from 'express';
import { createCoupon, getCoupons, applyCoupon } from '../controllers/couponController.js';
// We are bringing in the ADMIN guard this time!
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// The next two routes require you to be logged in AND be an Admin
router.post('/', protect, admin, createCoupon);
router.get('/', protect, admin, getCoupons);

// Any logged-in user can apply a coupon to their cart
router.post('/apply', protect, applyCoupon);

export default router;
