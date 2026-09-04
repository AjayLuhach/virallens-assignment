import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config.js';
import { httpError } from '../types/index.js';
import type { AuthUser } from '../types/index.js';
import userRepository from '../repositories/user.repository.js';

interface AuthResult {
  user: AuthUser;
  token: string;
}

const DUMMY_HASH = '$2a$10$9OwdusTu0kvov79yP5.hBOO1qZwQ80.c7dhaaSiL11xB44iU0G6BK';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const signToken = (user: AuthUser) =>
  jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, { expiresIn: '7d' });

export const authService = {
  async signup(email: string, password: string): Promise<AuthResult> {
    const normalized = normalizeEmail(email);
    const existing = await userRepository.findByEmail(normalized);
    if (existing) {
      throw httpError(409, 'Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    try {
      const user = await userRepository.insert(normalized, passwordHash);
      return { user, token: signToken(user) };
    } catch (err) {
      if ((err as { code?: number }).code === 11000) {
        throw httpError(409, 'Email already registered');
      }
      throw err;
    }
  },

  async login(email: string, password: string): Promise<AuthResult> {
    const found = await userRepository.findByEmailWithHash(normalizeEmail(email));
    if (!found) {
      await bcrypt.compare(password, DUMMY_HASH);
      throw httpError(401, 'Invalid email or password');
    }

    const matches = await bcrypt.compare(password, found.passwordHash);
    if (!matches) {
      throw httpError(401, 'Invalid email or password');
    }

    return { user: found.user, token: signToken(found.user) };
  },

  async me(userId: string): Promise<AuthUser> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw httpError(401, 'Not authenticated');
    }

    return user;
  }
};

export default authService;
