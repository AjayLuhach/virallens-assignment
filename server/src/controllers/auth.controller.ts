import type { CookieOptions, Request, Response } from 'express';
import config from '../config.js';
import { SignupSchema, LoginSchema } from '../types/index.js';
import authService from '../services/auth.service.js';

const cookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: config.cookieSecure ? 'none' : 'lax',
  secure: config.cookieSecure,
  path: '/'
};

const setAuthCookie = (res: Response, token: string) => {
  res.cookie('token', token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
};

export const authController = {
  async signup(req: Request, res: Response): Promise<void> {
    const parsed = SignupSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.issues[0].message });
      return;
    }

    const { user, token } = await authService.signup(parsed.data.email, parsed.data.password);
    setAuthCookie(res, token);
    res.status(201).json({ success: true, data: { user } });
  },

  async login(req: Request, res: Response): Promise<void> {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ success: false, error: parsed.error.issues[0].message });
      return;
    }

    const { user, token } = await authService.login(parsed.data.email, parsed.data.password);
    setAuthCookie(res, token);
    res.status(200).json({ success: true, data: { user } });
  },

  async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('token', cookieOptions);
    res.status(200).json({ success: true, data: { message: 'Logged out' } });
  },

  async me(req: Request, res: Response): Promise<void> {
    const user = await authService.me(req.userId as string);
    res.status(200).json({ success: true, data: { user } });
  }
};

export default authController;
