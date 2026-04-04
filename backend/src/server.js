const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize our Express app
const app = express();

// Middleware
// cors() allows our React frontend to communicate with this backend without security errors.
app.use(cors()); 
// json() allows us to access incoming data formatted as JSON (like form submissions)
app.use(express.json()); 

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
