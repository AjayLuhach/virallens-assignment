import { Types } from 'mongoose';
import { User } from '../db/models.js';
import type { AuthUser, UserDoc } from '../types/index.js';

const toAuthUser = (doc: UserDoc): AuthUser => ({
  id: doc._id.toString(),
  email: doc.email,
  createdAt: doc.createdAt.toISOString()
});

export const userRepository = {
  async findByEmail(email: string): Promise<AuthUser | null> {
    const doc = await User.findOne({ email }).lean<UserDoc | null>();
    return doc ? toAuthUser(doc) : null;
  },

  async findByEmailWithHash(email: string): Promise<{ user: AuthUser; passwordHash: string } | null> {
    const doc = await User.findOne({ email }).lean<UserDoc | null>();
    return doc ? { user: toAuthUser(doc), passwordHash: doc.passwordHash } : null;
  },

  async findById(id: string): Promise<AuthUser | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const doc = await User.findById(id).lean<UserDoc | null>();
    return doc ? toAuthUser(doc) : null;
  },

  async insert(email: string, passwordHash: string): Promise<AuthUser> {
    const doc = await User.create({ email, passwordHash, createdAt: new Date() });
    return { id: doc._id.toString(), email: doc.email, createdAt: doc.createdAt.toISOString() };
  }
};

export default userRepository;
