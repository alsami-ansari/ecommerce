import express from 'express';
// We added getUserProfile here:
import { authUser, registerUser, getUserProfile } from '../controllers/userController.js';
// We imported the protect middleware here:
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', authUser);
router.post('/register', registerUser);

// Notice we put `protect` in the middle! It intercepts the request before reaching getUserProfile
router.get('/profile', protect, getUserProfile);

export default router;
