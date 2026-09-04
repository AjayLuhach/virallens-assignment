import mongoose from 'mongoose';
import config from '../config.js';
import { Conversation, Message, User } from './models.js';

export const connectDb = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) return;

  mongoose.set('strictQuery', true);

  await mongoose.connect(config.mongoUri, {
    dbName: config.mongoDb,
    serverSelectionTimeoutMS: 10000
  });

  await Promise.all([User.init(), Conversation.init(), Message.init()]);

  console.log(`Connected to MongoDB database "${config.mongoDb}"`);
};

export const closeDb = async (): Promise<void> => {
  if (mongoose.connection.readyState === 0) return;
  await mongoose.disconnect();
};

export const db = {
  connectDb,
  closeDb
};

export default db;
