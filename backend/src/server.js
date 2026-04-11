import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import path from 'path'; // A built-in Node package for file paths
import uploadRoutes from './routes/uploadRoutes.js';
import morgan from 'morgan';







// Load environment variables
dotenv.config();

// Connect to MongoDB
import connectDB from './config/db.js';
import productRoutes from './routes/productRoutes.js';
connectDB();

// Initialize our Express app
const app = express();
// This logs incoming traffic to your terminal!
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}


// 1. Helmet helps secure Express apps by setting various HTTP headers
app.use(helmet());

// 2. Limit repeated requests to prevent DDoS attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per 15 mins
  message: 'Too many requests from this IP, please try again in 15 minutes'
});
app.use(limiter);


// Middleware
// cors() allows our React frontend to communicate with this backend without security errors.
app.use(cors()); 
// json() allows us to access incoming data formatted as JSON (like form submissions)
app.use(express.json()); 

// Mount our Product routes
app.use('/api/products', productRoutes); 

// Mount User routes
app.use('/api/users', userRoutes);

// Mount Order routes
app.use('/api/orders', orderRoutes);

app.use('/api/wishlist', wishlistRoutes);

app.use('/api/coupons', couponRoutes);

app.use('/api/admin', adminRoutes);

app.use('/api/upload', uploadRoutes);

// Make the uploads folder publicly accessible
const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));


// These must be the VERY LAST middlewares we use before app.listen!
app.use(notFound);
app.use(errorHandler);



// Basic Test Route
app.get('/', (req, res) => {
  res.send('Ecommerce API is running!');
});

// Define the port our server will run on
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
  console.log(`Server is up and running on port ${PORT} 🚀`);
});
