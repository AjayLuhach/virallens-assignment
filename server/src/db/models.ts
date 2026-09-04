import { Schema, model } from 'mongoose';
import type { ConversationDoc, MessageDoc, UserDoc } from '../types/index.js';

const userSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    createdAt: { type: Date, required: true, default: Date.now }
  },
  { versionKey: false }
);

const conversationSchema = new Schema<ConversationDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    model: { type: String, required: true },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now }
  },
  { versionKey: false }
);

const messageSchema = new Schema<MessageDoc>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, required: true, enum: ['user', 'assistant'] },
    content: { type: String, required: true },
    model: { type: String },
    createdAt: { type: Date, required: true, default: Date.now }
  },
  { versionKey: false }
);

userSchema.index({ email: 1 }, { unique: true, name: 'email_unique' });
conversationSchema.index({ userId: 1, updatedAt: -1 }, { name: 'user_recent' });
messageSchema.index({ conversationId: 1, createdAt: 1 }, { name: 'conversation_order' });

export const User = model<UserDoc>('User', userSchema);
export const Conversation = model<ConversationDoc>('Conversation', conversationSchema);
export const Message = model<MessageDoc>('Message', messageSchema);
