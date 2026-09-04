export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
}

export interface ModelOption {
  id: string;
  label: string;
  vendor: string;
  blurb: string;
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
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  conversationId?: string;
  model?: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuthResult {
  user: AuthUser;
}

export interface LogoutResult {
  message: string;
}

export interface ModelsResult {
  models: ModelOption[];
  defaultModel: string;
}

export interface HistoryResult {
  conversations: ConversationSummary[];
}

export interface ConversationDetail {
  conversation: ConversationSummary;
  messages: ChatMessage[];
}

export interface SendResult {
  conversationId: string;
  title: string;
  reply: string;
}
