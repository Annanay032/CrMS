import OpenAI from 'openai';
import { env } from './env.js';

export const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY || 'sk-placeholder',
  ...(env.OPENAI_BASE_URL ? { baseURL: env.OPENAI_BASE_URL } : {}),
});
