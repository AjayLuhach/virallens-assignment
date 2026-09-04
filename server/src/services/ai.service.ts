import config from '../config.js';
import { aiUnavailableError } from '../types/index.js';

export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface CompletionPayload {
  choices?: { message?: { content?: string } }[];
}

const SYSTEM_PROMPT =
  'You are the customer support assistant for ViralLens, a social video analytics platform. ' +
  'Be friendly, warm and concise, the way a good support agent is in a live chat. ' +
  'You answer from your own knowledge alone. You cannot see the customer account, their dashboard, ' +
  'their billing or any order, and you cannot look anything up or take any action on their behalf. ' +
  'Never invent specific numbers, statuses, dates or account details, and never claim to be checking ' +
  'or fetching something. Explain how the platform and its metrics work, help the customer interpret ' +
  'what they are seeing, and say where in the product to look. For anything account-specific, say ' +
  'plainly that you cannot access it and point them to a human. ' +
  'When a request is vague, ask one short clarifying question instead of guessing. ' +
  'Reply in plain text only: no markdown headers, no bullet lists, no bold. Keep answers under 120 words.';

const REQUEST_TIMEOUT_MS = 30000;
const MAX_TOKENS = 800;
const TEMPERATURE = 0.7;
const LOG_LIMIT = 500;

const readBody = async (response: Response): Promise<string> => {
  try {
    return await response.text();
  } catch {
    return '';
  }
};

const extractReply = (raw: string): string => {
  try {
    const payload = JSON.parse(raw) as CompletionPayload;
    return payload.choices?.[0]?.message?.content?.trim() || '';
  } catch {
    return '';
  }
};

export const aiService = {
  async complete(model: string, history: AiMessage[]): Promise<string> {
    let response: Response;

    try {
      response = await fetch(`${config.bedrock.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.bedrock.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
          max_tokens: MAX_TOKENS,
          temperature: TEMPERATURE
        }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
    } catch (err) {
      console.error(`AI request to ${model} never completed:`, (err as Error).message);
      throw aiUnavailableError();
    }

    if (!response.ok) {
      const body = await readBody(response);
      console.error(`AI provider answered ${response.status} for ${model}:`, body.slice(0, LOG_LIMIT));
      throw aiUnavailableError();
    }

    const raw = await readBody(response);
    const reply = extractReply(raw);
    if (!reply) {
      console.error(`AI provider returned an unusable payload for ${model}:`, raw.slice(0, LOG_LIMIT));
      throw aiUnavailableError();
    }

    return reply;
  }
};

export default aiService;
