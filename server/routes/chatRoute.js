import express from 'express';
import { processChatAndAddToCart } from '../controllers/chatController.js';
import authUser from '../middlewares/authUser.js';

const router = express.Router();

// POST /api/chat/process
router.post('/process', authUser, processChatAndAddToCart);

// POST /api/chat (alias so all frontend components work)
router.post('/', authUser, processChatAndAddToCart);

export default router;
