import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';
import { extractTransaction } from "../controllers/aiController.js"

router.use(protect);

router.post("/ai/extract", extractTransaction);

export default router;