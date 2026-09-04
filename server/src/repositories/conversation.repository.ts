import { Types } from 'mongoose';
import { Conversation, Message } from '../db/models.js';
import type { ChatMessage, ConversationDoc, ConversationSummary, MessageDoc, MessageRole } from '../types/index.js';

export interface NewMessage {
  userId: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  model?: string;
}

const toObjectId = (id: string): Types.ObjectId | null =>
  Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null;

const toConversation = (doc: ConversationDoc): ConversationSummary => ({
  id: doc._id.toString(),
  title: doc.title,
  model: doc.model,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString()
});

const toMessage = (doc: MessageDoc): ChatMessage => ({
  id: doc._id.toString(),
  role: doc.role,
  content: doc.content,
  model: doc.model,
  createdAt: doc.createdAt.toISOString()
});

export const conversationRepository = {
  async create(userId: string, title: string, model: string): Promise<ConversationSummary> {
    const now = new Date();
    const doc = await Conversation.create({
      userId: new Types.ObjectId(userId),
      title,
      model,
      createdAt: now,
      updatedAt: now
    });

    return {
      id: doc._id.toString(),
      title: doc.title,
      model: doc.model,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString()
    };
  },

  async findById(userId: string, conversationId: string): Promise<ConversationSummary | null> {
    const _id = toObjectId(conversationId);
    if (!_id) {
      return null;
    }

    const doc = await Conversation.findOne({ _id, userId: new Types.ObjectId(userId) }).lean<ConversationDoc | null>();
    return doc ? toConversation(doc) : null;
  },

  async listByUser(userId: string): Promise<ConversationSummary[]> {
    const docs = await Conversation.find({ userId: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .lean<ConversationDoc[]>();

    return docs.map(toConversation);
  },

  async updateActivity(userId: string, conversationId: string, model: string): Promise<void> {
    await Conversation.updateOne(
      { _id: new Types.ObjectId(conversationId), userId: new Types.ObjectId(userId) },
      { model, updatedAt: new Date() }
    );
  },

  async addMessage(input: NewMessage): Promise<ChatMessage> {
    const doc = await Message.create({
      conversationId: new Types.ObjectId(input.conversationId),
      userId: new Types.ObjectId(input.userId),
      role: input.role,
      content: input.content,
      ...(input.model ? { model: input.model } : {}),
      createdAt: new Date()
    });

    return {
      id: doc._id.toString(),
      role: doc.role,
      content: doc.content,
      model: doc.model,
      createdAt: doc.createdAt.toISOString()
    };
  },

  async listMessages(userId: string, conversationId: string): Promise<ChatMessage[]> {
    const docs = await Message.find({
      conversationId: new Types.ObjectId(conversationId),
      userId: new Types.ObjectId(userId)
    })
      .sort({ createdAt: 1 })
      .lean<MessageDoc[]>();

    return docs.map(toMessage);
  },

  async listRecentMessages(userId: string, conversationId: string, limit: number): Promise<ChatMessage[]> {
    const docs = await Message.find({
      conversationId: new Types.ObjectId(conversationId),
      userId: new Types.ObjectId(userId)
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean<MessageDoc[]>();

    return docs.reverse().map(toMessage);
  }
};

export default conversationRepository;
