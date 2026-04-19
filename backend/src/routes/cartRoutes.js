import express from 'express';
import { getMyCart, addToCart, removeFromCart } from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All Cart routes require the user to be logged in!
router.get('/', protect, getMyCart);
router.post('/add', protect, addToCart);
router.post('/remove', protect, removeFromCart);

export default router;
