"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const redis_1 = require("../config/redis");
class CacheService {
    static async get(key) {
        const raw = await redis_1.redis.get(key);
        if (!raw)
            return null;
        try {
            return JSON.parse(raw);
        }
        catch {
            return null;
        }
    }
    static async set(key, data, ttlSeconds = 300) {
        await redis_1.redis.set(key, JSON.stringify(data), ttlSeconds);
    }
    static async del(key) {
        await redis_1.redis.del(key);
    }
}
exports.CacheService = CacheService;
