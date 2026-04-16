import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

// Protect routes - you must be logged in to access them
export const protect = async (req, res, next) => {
  let token;

  // Check if there is an authorization header with a Bearer token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (it looks like "Bearer eyJhbGciOi...")
      token = req.headers.authorization.split(' ')[1];
  
      // Decode the token using our secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch the user from the DB using the decoded ID, and attach it to the request object
      // We use .select('-password') to make sure we don't accidentally expose the hashed password
      req.user = await User.findById(decoded.userId).select('-password');

      next(); // Move on to the controller function
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// Admin middleware - you must be logged in AND be an admin
export const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};
