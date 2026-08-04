import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().default('postgresql://finsight_user:finsight_password@localhost:5432/finsight_db?schema=public'),
  REDIS_URL: z.string().optional(),
  JWT_SECRET: z.string().default('finsight_super_secret_access_token_key_2026_production'),
  REFRESH_TOKEN_SECRET: z.string().default('finsight_super_secret_refresh_token_key_2026_production'),
  GEMINI_API_KEY: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLIENT_URL: z.string().default('http://localhost:5173'),
});

export const env = envSchema.parse(process.env);
