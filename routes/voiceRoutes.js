import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
import { enrollVoice, verifyVoice } from '../controllers/voiceController.js';

router.use(protect);

router.post('/enroll', protect, enrollVoice);
router.post('/verify', protect, verifyVoice);

export default router;