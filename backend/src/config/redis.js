'use strict';
const IORedis = require('ioredis');

let redisClient = null;
let isRedisAvailable = false;

/**
 * Creates and connects the Redis client.
 * If REDIS_URL is not set or Redis is unreachable, all cache operations become no-ops.
 */
function connectRedis() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.log('[Redis] REDIS_URL not set — running without Redis cache (graceful fallback).');
    return null;
  }

  try {
    const client = new IORedis(redisUrl, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
      connectTimeout: 3000,
    });

    client.on('connect', () => {
      isRedisAvailable = true;
      console.log('[Redis] ✅ Connected successfully.');
    });

    client.on('error', (err) => {
      if (isRedisAvailable) {
        console.warn('[Redis] ⚠️  Connection lost — falling back to no-cache mode:', err.message);
      }
      isRedisAvailable = false;
    });

    client.connect().catch(() => {
      console.warn('[Redis] ⚠️  Could not connect — running without Redis cache.');
    });

    redisClient = client;
    return client;
  } catch (err) {
    console.warn('[Redis] ⚠️  Init error — running without Redis cache:', err.message);
    return null;
  }
}

/**
 * Get a cached value (returns null if Redis unavailable or key missing).
 */
async function getCache(key) {
  if (!redisClient || !isRedisAvailable) return null;
  try {
    const raw = await redisClient.get(key);
    if (raw) {
      console.log(`[Redis] 🎯 Cache HIT: ${key}`);
      return JSON.parse(raw);
    }
    console.log(`[Redis] ❌ Cache MISS: ${key}`);
    return null;
  } catch {
    return null;
  }
}

/**
 * Set a cached value with optional TTL in seconds.
 */
async function setCache(key, value, ttlSeconds = 60) {
  if (!redisClient || !isRedisAvailable) return;
  try {
    await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    console.log(`[Redis] 💾 Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
  } catch {
    // Silently fail — caching is best-effort
  }
}

/**
 * Delete one or more cached keys (supports glob pattern via SCAN+DEL).
 */
async function delCache(key) {
  if (!redisClient || !isRedisAvailable) return;
  try {
    // Support wildcard patterns
    if (key.includes('*')) {
      const keys = await redisClient.keys(key);
      if (keys.length > 0) {
        await redisClient.del(...keys);
        console.log(`[Redis] 🗑️  Deleted ${keys.length} key(s) matching: ${key}`);
      }
    } else {
      await redisClient.del(key);
      console.log(`[Redis] 🗑️  Deleted key: ${key}`);
    }
  } catch {
    // Silently fail
  }
}

module.exports = { connectRedis, getCache, setCache, delCache, getRedisClient: () => redisClient, isRedisReady: () => isRedisAvailable };
