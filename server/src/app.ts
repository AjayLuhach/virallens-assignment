import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import config from './config.js';
import { AI_UNAVAILABLE_MESSAGE } from './types/index.js';
import type { HttpError } from './types/index.js';
import authRouter from './routers/auth.router.js';
import chatRouter from './routers/chat.router.js';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.ip || req.socket.remoteAddress || 'unknown',
  message: { success: false, error: 'Too many attempts. Please try again in a few minutes.' }
});

const resolveStatus = (err: HttpError): number => {
  if (typeof err.status === 'number' && err.status >= 400 && err.status <= 599) return err.status;
  if (err.code === 'AI_UNAVAILABLE') return 502;
  return 500;
};

const resolveMessage = (err: HttpError, status: number): string => {
  if (status === 502) return AI_UNAVAILABLE_MESSAGE;
  if (status >= 500) return 'Something went wrong. Please try again.';
  return err.message || 'Request failed';
};

const app = express();

if (config.trustProxy) {
  app.set('trust proxy', config.trustProxy);
}

app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '256kb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authLimiter, authRouter);
app.use('/chat', chatRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

app.use((err: HttpError, _req: Request, res: Response, _next: NextFunction) => {
  const status = resolveStatus(err);
  console.error(`[${status}] ${err.message}`, status >= 500 ? err.stack : '');
  res.status(status).json({ success: false, error: resolveMessage(err, status) });
});

export default app;
