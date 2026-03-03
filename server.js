import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import voiceRoutes from "./routes/voiceRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

dotenv.config();
connectDB();

const app = express();

// ✅ CORS must come first, before everything
app.use(
  cors({
    origin: "https://voxledger.onrender.com", // ✅ your production frontend
    credentials: true,
  }),
);

app.use(express.json());

// Routes
<<<<<<< HEAD
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/voice", voiceRoutes);
app.use("/api", aiRoutes);

// Health check
app.get("/", (req, res) => res.json({ message: "API is running" }));
=======
app.use(cors({'origin': process.env.FRONTEND_URL}));
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/voice', voiceRoutes);
app.use('/api', aiRoutes);

// Health check
app.get('/', (req, res) => res.json({ message: 'API is running' }));

>>>>>>> b9aacf60741e902c2d1ba9c9f5168c600d2e9c57

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
