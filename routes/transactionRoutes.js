import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';

import { addTransaction, getTransactions, deleteTransaction, getSummary, getAnalytics } from '../controllers/transactionController.js'



router.post('/', protect, addTransaction);
router.get('/',protect, getTransactions);
router.get('/summary', protect, getSummary);
router.get('/analytics', protect, getAnalytics);
router.delete('/:id', protect, deleteTransaction);

export default router;