import express from 'express';
import { getAdminStats, getSalesData, getTopProducts } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Every single Admin route requires both the 'protect' and 'admin' security guard middleware!
router.get('/stats', protect, admin, getAdminStats);
router.get('/sales', protect, admin, getSalesData);
router.get('/top-products', protect, admin, getTopProducts);

export default router;
