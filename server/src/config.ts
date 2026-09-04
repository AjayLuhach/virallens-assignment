import 'dotenv/config';

// BEDROCK_BASE_URL points at the OpenAI-compatible Bedrock gateway and already ends in /v1.
// Callers append /chat/completions only, and authenticate with a plain bearer key (no SigV4).
const DEFAULT_BEDROCK_BASE_URL = 'https://bedrock-mantle.ap-south-1.api.aws/v1';
const DEFAULT_MODEL = 'qwen.qwen3-32b';

const models = [
  { id: 'qwen.qwen3-32b', label: 'Qwen3 32B', vendor: 'Qwen', blurb: 'Fast all-round default' },
  { id: 'qwen.qwen3-next-80b-a3b-instruct', label: 'Qwen3 Next 80B', vendor: 'Qwen', blurb: 'Sparse MoE, quick + sharper' },
  { id: 'qwen.qwen3-235b-a22b-2507', label: 'Qwen3 235B', vendor: 'Qwen', blurb: 'Largest Qwen, best reasoning' },
  { id: 'google.gemma-3-4b-it', label: 'Gemma 3 4B', vendor: 'Google', blurb: 'Tiny + cheapest' },
  { id: 'google.gemma-3-12b-it', label: 'Gemma 3 12B', vendor: 'Google', blurb: 'Balanced small model' },
  { id: 'google.gemma-3-27b-it', label: 'Gemma 3 27B', vendor: 'Google', blurb: 'Strongest Gemma' },
  { id: 'deepseek.v3.1', label: 'DeepSeek V3.1', vendor: 'DeepSeek', blurb: 'Strong general chat' },
  { id: 'deepseek.v3.2', label: 'DeepSeek V3.2', vendor: 'DeepSeek', blurb: 'Newest DeepSeek' }
];

const required = (name: string): string => {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable ${name} — copy .env.example to .env and fill it in`);
  }
  return value.trim();
};

const optional = (name: string, fallback: string): string => {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
};

const stripTrailingSlash = (url: string): string => url.replace(/\/+$/, '');

const envModel = optional('BEDROCK_MODEL', DEFAULT_MODEL);

const isProd = process.env.NODE_ENV === 'production';

export const config = Object.freeze({
  port: Number(optional('PORT', '4000')),
  host: optional('HOST', '0.0.0.0'),
  trustProxy: Number(optional('TRUST_PROXY', '0')),
  mongoUri: optional('MONGO_URI', 'mongodb://127.0.0.1:27017'),
  mongoDb: optional('MONGO_DB', 'virallens'),
  jwtSecret: required('JWT_SECRET'),
  corsOrigin: optional('CORS_ORIGIN', 'http://localhost:5173'),
  isProd,
  cookieSecure: optional('COOKIE_SECURE', String(isProd)) === 'true',
  bedrock: {
    baseUrl: stripTrailingSlash(optional('BEDROCK_BASE_URL', DEFAULT_BEDROCK_BASE_URL)),
    apiKey: required('BEDROCK_API_KEY')
  },
  models,
  defaultModel: models.some((model) => model.id === envModel) ? envModel : DEFAULT_MODEL
});

export default config;
