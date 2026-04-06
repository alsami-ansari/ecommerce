import express from 'express';
import { addOrderItems, getOrderById, getMyOrders, updateOrderToPaid } from '../controllers/orderController.js';
// We need the security guard to make sure only logged-in users can place and view orders!
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// When a POST request is sent to /api/orders, check the token, then create the order
router.post('/', protect, addOrderItems);

// When a GET request is sent to /api/orders/myorders, fetch their past orders
// (Important: place this route BEFORE the /:id route, otherwise Express thinks "myorders" is an ID)
router.get('/myorders', protect, getMyOrders);

// When a GET request is sent to /api/orders/:id, fetch that specific order
router.get('/:id', protect, getOrderById);

// When someone sends a PUT request here, update the payment status!
router.put('/:id/pay', protect, updateOrderToPaid);


export default router;
