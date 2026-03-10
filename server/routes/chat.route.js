import express from 'express';
import { postChatMessage } from '../controllers/chatController.js';

const chatRouter = express.Router();

// POST /api/chat
chatRouter.post('/', postChatMessage);

export default chatRouter;
// Integration: Import and use this router in server.js as app.use('/api/chat', chatRouter); 