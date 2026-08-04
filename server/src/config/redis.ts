import { createClient } from 'redis';
import { env } from './env';

class RedisManager {
  private client: ReturnType<typeof createClient> | null = null;
  private isConnected = false;
  private memoryCache: Map<string, { value: string; expiresAt: number }> = new Map();

  constructor() {
    if (env.REDIS_URL) {
      try {
        this.client = createClient({ url: env.REDIS_URL });
        this.client.on('error', (err) => {
          console.warn('[Redis] Connection error, using memory fallback:', err.message);
          this.isConnected = false;
        });
        this.client.on('connect', () => {
          console.log('[Redis] Connected successfully');
          this.isConnected = true;
        });
        this.client.connect().catch((err) => {
          console.warn('[Redis] Client connect failed, fallback enabled:', err.message);
          this.isConnected = false;
        });
      } catch (e) {
        console.warn('[Redis] Initialization error, fallback enabled.');
      }
    } else {
      console.log('[Redis] No REDIS_URL configured, operating in high-performance memory fallback mode.');
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.isConnected && this.client) {
      try {
        return await this.client.get(key);
      } catch (err) {
        // Fallback to memory
      }
    }
    const item = this.memoryCache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: string, ttlSeconds: number = 300): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.setEx(key, ttlSeconds, value);
        return;
      } catch (err) {
        // Fallback to memory
      }
    }
    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    if (this.isConnected && this.client) {
      try {
        await this.client.del(key);
      } catch (err) {
        // Fallback to memory
      }
    }
    this.memoryCache.delete(key);
  }
}

export const redis = new RedisManager();
