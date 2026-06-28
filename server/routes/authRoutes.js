import express from 'express';
import { registerUser, loginUser, getUserProfile, updateUserProfile, requestOTP, verifyOTP } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { authLimiter } from '../middleware/security.js';

const router = express.Router();

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/otp/request', authLimiter, requestOTP);
router.post('/otp/verify', authLimiter, verifyOTP);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);


export default router;
