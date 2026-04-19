import express from 'express';
import {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  getMyOrders,
  createRazorpayOrder,
  razorpayWebhook, 
  updateOrderStatus, 
  getSalesDashboard // <-- NEW: Import the Analytics Engine
} from '../controllers/orderController.js';


// We need the security guard to make sure only logged-in users can place and view orders!
// Also importing 'admin' so we can protect the dashboard routes
import { protect, admin } from '../middleware/authMiddleware.js';


const router = express.Router();

// When a POST request is sent to /api/orders, check the token, then create the order
router.post('/', protect, addOrderItems);

// When a GET request is sent to /api/orders/myorders, fetch their past orders
// (Important: place this route BEFORE the /:id route, otherwise Express thinks "myorders" is an ID)
router.get('/myorders', protect, getMyOrders);


// MUST be placed above /:id to prevent Express routing collisions!
router.get('/analytics/dashboard', protect, admin, getSalesDashboard);

// When a GET request is sent to /api/orders/:id, fetch that specific order
router.get('/:id', protect, getOrderById);

// ==========================================
// ADMIN DASHBOARD ROUTES
// ==========================================



// Update logistics status (Shipped, Cancelled, Delivered)
router.put('/:id/status', protect, admin, updateOrderStatus);


// When someone sends a PUT request here, update the payment status!
router.put('/:id/pay', protect, updateOrderToPaid);

// When the frontend needs to open the popup, it hits this!
router.post('/:id/razorpay', protect, createRazorpayOrder);

// ==========================================
// ADMIN DASHBOARD ROUTES
// ==========================================

// @desc    Update logistics status (Shipped, Cancelled, Delivered)
router.put('/:id/status', protect, admin, updateOrderStatus);


export default router;
