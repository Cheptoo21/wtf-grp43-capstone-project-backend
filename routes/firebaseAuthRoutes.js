import express from 'express';
import { firebaseAuth } from '../controllers/firebaseAuthController.js';
const router = express.Router();



router.post("/firebase", firebaseAuth);

export default router;