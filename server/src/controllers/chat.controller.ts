import type { Request, Response } from 'express';
import { ConversationParamsSchema, SendMessageSchema } from '../types/index.js';
import chatService from '../services/chat.service.js';

const notFound = (res: Response): void => {
  res.status(404).json({ success: false, error: 'Conversation not found' });
};

export const chatController = {
  async getModels(_req: Request, res: Response): Promise<void> {
    const catalog = await chatService.listModels();
    res.status(200).json({ success: true, data: catalog });
  },

  async sendMessage(req: Request, res: Response): Promise<void> {
    const parsed = SendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      if (issue.path[0] === 'conversationId') {
        notFound(res);
        return;
      }
      res.status(400).json({ success: false, error: issue.message });
      return;
    }

    const result = await chatService.sendMessage(req.userId as string, parsed.data);
    res.status(200).json({ success: true, data: result });
  },

  async listConversations(req: Request, res: Response): Promise<void> {
    const conversations = await chatService.listConversations(req.userId as string);
    res.status(200).json({ success: true, data: { conversations } });
  },

  async getConversation(req: Request, res: Response): Promise<void> {
    const parsed = ConversationParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      notFound(res);
      return;
    }

    const thread = await chatService.getConversation(req.userId as string, parsed.data.conversationId);
    res.status(200).json({ success: true, data: thread });
  }
};

export default chatController;
