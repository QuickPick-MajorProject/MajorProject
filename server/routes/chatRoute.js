import express from 'express';
import { processChatAndAddToCart } from '../controllers/chatController.js';

const router = express.Router();

// POST /api/chat/process
router.post('/process', processChatAndAddToCart);

export default router;
