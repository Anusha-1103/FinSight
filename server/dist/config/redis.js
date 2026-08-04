"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
const redis_1 = require("redis");
const env_1 = require("./env");
class RedisManager {
    client = null;
    isConnected = false;
    memoryCache = new Map();
    constructor() {
        if (env_1.env.REDIS_URL) {
            try {
                this.client = (0, redis_1.createClient)({ url: env_1.env.REDIS_URL });
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
            }
            catch (e) {
                console.warn('[Redis] Initialization error, fallback enabled.');
            }
        }
        else {
            console.log('[Redis] No REDIS_URL configured, operating in high-performance memory fallback mode.');
        }
    }
    async get(key) {
        if (this.isConnected && this.client) {
            try {
                return await this.client.get(key);
            }
            catch (err) {
                // Fallback to memory
            }
        }
        const item = this.memoryCache.get(key);
        if (!item)
            return null;
        if (Date.now() > item.expiresAt) {
            this.memoryCache.delete(key);
            return null;
        }
        return item.value;
    }
    async set(key, value, ttlSeconds = 300) {
        if (this.isConnected && this.client) {
            try {
                await this.client.setEx(key, ttlSeconds, value);
                return;
            }
            catch (err) {
                // Fallback to memory
            }
        }
        this.memoryCache.set(key, {
            value,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
    }
    async del(key) {
        if (this.isConnected && this.client) {
            try {
                await this.client.del(key);
            }
            catch (err) {
                // Fallback to memory
            }
        }
        this.memoryCache.delete(key);
    }
}
exports.redis = new RedisManager();
