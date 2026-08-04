"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('5000'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: zod_1.z.string().default('postgresql://finsight_user:finsight_password@localhost:5432/finsight_db?schema=public'),
    REDIS_URL: zod_1.z.string().optional(),
    JWT_SECRET: zod_1.z.string().default('finsight_super_secret_access_token_key_2026_production'),
    REFRESH_TOKEN_SECRET: zod_1.z.string().default('finsight_super_secret_refresh_token_key_2026_production'),
    GEMINI_API_KEY: zod_1.z.string().optional(),
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().optional(),
    CLOUDINARY_API_KEY: zod_1.z.string().optional(),
    CLOUDINARY_API_SECRET: zod_1.z.string().optional(),
    CLIENT_URL: zod_1.z.string().default('http://localhost:5173'),
});
exports.env = envSchema.parse(process.env);
