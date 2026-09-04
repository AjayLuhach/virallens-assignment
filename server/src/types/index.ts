import type { Types } from 'mongoose';
import { z } from 'zod';
import config from '../config.js';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const modelIds = config.models.map((model) => model.id) as [string, ...string[]];

export const ObjectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const SignupSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(72, 'Password is too long')
});

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export const SendMessageSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty').max(4000, 'Message is too long'),
  conversationId: ObjectIdSchema.optional(),
  model: z.enum(modelIds, { errorMap: () => ({ message: 'Unknown model' }) }).optional()
});

export const ConversationParamsSchema = z.object({
  conversationId: ObjectIdSchema
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;

export type ModelOption = (typeof config.models)[number];
export type MessageRole = 'user' | 'assistant';

export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  model: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  model?: string;
  createdAt: string;
}

export interface UserDoc {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export interface ConversationDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  model: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageDoc {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
  role: MessageRole;
  content: string;
  model?: string;
  createdAt: Date;
}

export interface HttpError extends Error {
  status?: number;
  code?: string;
}

export const AI_UNAVAILABLE_MESSAGE = 'The assistant is unavailable right now. Please try again.';

export const httpError = (status: number, message: string, code?: string): HttpError => {
  const error = new Error(message) as HttpError;
  error.status = status;
  if (code) error.code = code;
  return error;
};

export const aiUnavailableError = (): HttpError =>
  httpError(502, AI_UNAVAILABLE_MESSAGE, 'AI_UNAVAILABLE');
