import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config.js';
import type { TokenPayload } from '../types/index.js';

const deny = (res: Response): void => {
  res.status(401).json({ success: false, error: 'Not authenticated' });
};

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies?.token;
  if (typeof token !== 'string' || !token) {
    deny(res);
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as TokenPayload;
    if (!payload?.sub) {
      deny(res);
      return;
    }
    req.userId = payload.sub;
    next();
  } catch {
    deny(res);
  }
};

export default requireAuth;
