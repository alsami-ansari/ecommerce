import express from 'express';
// We added getUserProfile here:
import { authUser, registerUser, getUserProfile } from '../controllers/userController.js';
// We imported the protect middleware here:
import { protect } from '../middleware/authMiddleware.js';
import { check } from 'express-validator';
import { runValidation } from '../middleware/validationMiddleware.js';


const router = express.Router();

router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  runValidation,
  authUser
);

// Register requires a Name, a valid Email format, and a password > 6 characters
router.post(
  '/register',
  [
    // These are the strict rules!
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email address').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  ],
  runValidation, // Intercept and check the rules
  registerUser   // Finally run the controller
);



// Notice we put `protect` in the middle! It intercepts the request before reaching getUserProfile
router.get('/profile', protect, getUserProfile);

export default router;
