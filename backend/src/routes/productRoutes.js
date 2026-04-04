import express from 'express';
import { getProducts, getProductById } from '../controllers/productController.js';

const router = express.Router();

// When someone goes to GET /api/products, call getProducts function
router.get('/', getProducts);

// When someone goes to GET /api/products/:id, call getProductById function
router.get('/:id', getProductById);

export default router;
