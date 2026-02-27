import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

dotenv.config();
connectDB();

const app = express();

app.use(express.json());

// Routes
app.use(cors({'origin': 'http://localhost:5173'}));
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api', aiRoutes);

// Health check
app.get('/', (req, res) => res.json({ message: 'API is running' }));

// In your backend/server.js
// router.post("/ai/extract", protect, extractTransaction);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));