import { Router } from 'express';
import type { Request } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/auth.js';
import chatController from '../controllers/chat.controller.js';

const sendLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.userId || req.ip || 'unknown',
  message: { success: false, error: 'You are sending messages too quickly. Please slow down.' }
});

const router = Router();

router.get('/models', async (req, res, next) => {
  try {
    await chatController.getModels(req, res);
  } catch (err) {
    next(err);
  }
});

router.use(requireAuth);

router.post('/send', sendLimiter, async (req, res, next) => {
  try {
    await chatController.sendMessage(req, res);
  } catch (err) {
    next(err);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    await chatController.listConversations(req, res);
  } catch (err) {
    next(err);
  }
});

router.get('/history/:conversationId', async (req, res, next) => {
  try {
    await chatController.getConversation(req, res);
  } catch (err) {
    next(err);
  }
});

export default router;
