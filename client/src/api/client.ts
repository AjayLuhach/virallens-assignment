import type {
  ApiEnvelope,
  AuthResult,
  ConversationDetail,
  HistoryResult,
  LogoutResult,
  ModelsResult,
  SendResult
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE || '';

const parseBody = async (response: Response) => {
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
};

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init
  });
  const payload = (await parseBody(response)) as ApiEnvelope<T> | null;
  if (!response.ok || !payload || payload.success !== true) {
    throw new Error(payload?.error || 'Something went wrong. Please try again.');
  }
  return payload.data as T;
};

export const signup = async (email: string, password: string): Promise<AuthResult> =>
  request<AuthResult>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

export const login = async (email: string, password: string): Promise<AuthResult> =>
  request<AuthResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

export const logout = async (): Promise<LogoutResult> =>
  request<LogoutResult>('/auth/logout', { method: 'POST' });

export const me = async (): Promise<AuthResult> => request<AuthResult>('/auth/me');

export const getModels = async (): Promise<ModelsResult> => request<ModelsResult>('/chat/models');

export const sendMessage = async (
  message: string,
  conversationId?: string,
  model?: string
): Promise<SendResult> =>
  request<SendResult>('/chat/send', {
    method: 'POST',
    body: JSON.stringify({ message, conversationId, model })
  });

export const getHistory = async (): Promise<HistoryResult> =>
  request<HistoryResult>('/chat/history');

export const getConversation = async (conversationId: string): Promise<ConversationDetail> =>
  request<ConversationDetail>(`/chat/history/${conversationId}`);
