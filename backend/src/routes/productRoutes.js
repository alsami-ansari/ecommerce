import express from 'express';
// Add createProductReview to your import!
import { getProducts, getProductById, createProductReview } from '../controllers/productController.js';
// Import the protector
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// When someone goes to GET /api/products, call getProducts function
router.get('/', getProducts);

// When someone goes to GET /api/products/:id, call getProductById function
router.get('/:id', getProductById);

// When a POST request hits this URL, check the token, then try to create the review!
router.post('/:id/reviews', protect, createProductReview);


export default router;
