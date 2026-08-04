import { redis } from '../config/redis';

export class CacheService {
  static async get<T>(key: string): Promise<T | null> {
    const raw = await redis.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  static async set(key: string, data: any, ttlSeconds: number = 300): Promise<void> {
    await redis.set(key, JSON.stringify(data), ttlSeconds);
  }

  static async del(key: string): Promise<void> {
    await redis.del(key);
  }
}
