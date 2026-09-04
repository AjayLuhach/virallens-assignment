import config from '../config.js';
import { httpError } from '../types/index.js';
import type { ChatMessage, ConversationSummary, ModelOption, SendMessageInput } from '../types/index.js';
import conversationRepository from '../repositories/conversation.repository.js';
import aiService from './ai.service.js';
import type { AiMessage } from './ai.service.js';

export interface ModelCatalog {
  models: ModelOption[];
  defaultModel: string;
}

export interface SendMessageResult {
  conversationId: string;
  title: string;
  reply: string;
}

export interface ConversationThread {
  conversation: ConversationSummary;
  messages: ChatMessage[];
}

const CONTEXT_SIZE = 10;
const TITLE_LENGTH = 60;

const buildTitle = (message: string): string => {
  const cleaned = message.replace(/\s+/g, ' ').trim();
  if (!cleaned) {
    return 'New conversation';
  }

  return cleaned.length > TITLE_LENGTH ? `${cleaned.slice(0, TITLE_LENGTH).trim()}…` : cleaned;
};

const toAiMessage = (message: ChatMessage): AiMessage => ({
  role: message.role,
  content: message.content
});

const dropDanglingReply = (history: ChatMessage[]): ChatMessage[] =>
  history.length > 0 && history[0].role === 'assistant' ? history.slice(1) : history;

export const chatService = {
  async listModels(): Promise<ModelCatalog> {
    return { models: config.models, defaultModel: config.defaultModel };
  },

  async sendMessage(userId: string, input: SendMessageInput): Promise<SendMessageResult> {
    const model = input.model || config.defaultModel;
    const conversation = input.conversationId
      ? await conversationRepository.findById(userId, input.conversationId)
      : await conversationRepository.create(userId, buildTitle(input.message), model);

    if (!conversation) {
      throw httpError(404, 'Conversation not found');
    }

    const previous = await conversationRepository.listRecentMessages(userId, conversation.id, CONTEXT_SIZE);

    await conversationRepository.addMessage({
      userId,
      conversationId: conversation.id,
      role: 'user',
      content: input.message
    });

    const context: AiMessage[] = [
      ...dropDanglingReply(previous).map(toAiMessage),
      { role: 'user', content: input.message }
    ];
    const reply = await aiService.complete(model, context);

    await conversationRepository.addMessage({
      userId,
      conversationId: conversation.id,
      role: 'assistant',
      content: reply,
      model
    });
    await conversationRepository.updateActivity(userId, conversation.id, model);

    return { conversationId: conversation.id, title: conversation.title, reply };
  },

  async listConversations(userId: string): Promise<ConversationSummary[]> {
    return conversationRepository.listByUser(userId);
  },

  async getConversation(userId: string, conversationId: string): Promise<ConversationThread> {
    const conversation = await conversationRepository.findById(userId, conversationId);
    if (!conversation) {
      throw httpError(404, 'Conversation not found');
    }

    const messages = await conversationRepository.listMessages(userId, conversation.id);
    return { conversation, messages };
  }
};

export default chatService;
