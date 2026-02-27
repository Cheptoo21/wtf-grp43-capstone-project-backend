import express from 'express';
import { signup, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();


router.post('/signup', signup);
router.post('/login', login);
router.get('/me', protect, getMe); // protected route example

export default router;