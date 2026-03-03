import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
import { extractTransaction } from "../controllers/aiController.js"


router.post("/ai/extract", protect, extractTransaction);

export default router;