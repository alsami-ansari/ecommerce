import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Connect to MongoDB
import connectDB from './config/db.js';
import productRoutes from './routes/productRoutes.js';
connectDB();

// Initialize our Express app
const app = express();

// Middleware
// cors() allows our React frontend to communicate with this backend without security errors.
app.use(cors()); 
// json() allows us to access incoming data formatted as JSON (like form submissions)
app.use(express.json()); 

// Mount our Product routes
app.use('/api/products', productRoutes); 

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
