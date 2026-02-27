import express from 'express';
const router = express.Router();
import { protect } from '../middleware/authMiddleware.js';

import { addTransaction, getTransactions, deleteTransaction, getSummary, getAnalytics } from '../controllers/transactionController.js'

router.use(protect);

router.post('/', addTransaction);
router.get('/', getTransactions);
router.get('/summary', getSummary);
router.get('/analytics', getAnalytics);
router.delete('/:id', deleteTransaction);

export default router;