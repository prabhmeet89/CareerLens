'use strict';

const { getCache, setCache, delCache } = require('../src/config/redis');
const { recommendedKey, recommendedPattern, invalidateRecommendations } = require('../src/utils/cacheKeys');

describe('Redis Caching Layer & Invalidation Suite', () => {
  describe('Cache Key Builders', () => {
    test('builds exact recommendation page keys', () => {
      const key = recommendedKey('user_abc123', 1, 10);
      expect(key).toBe('recommended:user_abc123:p1:l10');
    });

    test('builds wildcard recommendation pattern', () => {
      const pattern = recommendedPattern('user_abc123');
      expect(pattern).toBe('recommended:user_abc123:*');
    });
  });

  describe('Graceful Fallback & Best-Effort Resilience', () => {
    test('getCache returns null safely when key does not exist or Redis is in no-op mode', async () => {
      const result = await getCache('non_existent_key_99999');
      expect(result).toBeNull();
    });

    test('setCache executes without throwing error', async () => {
      await expect(
        setCache('test:job:123', { id: '123', title: 'Full Stack Engineer' }, 60)
      ).resolves.not.toThrow();
    });

    test('delCache executes exact and wildcard pattern deletion without throwing error', async () => {
      await expect(delCache('test:job:123')).resolves.not.toThrow();
      await expect(delCache('test:job:*')).resolves.not.toThrow();
    });

    test('invalidateRecommendations executes safely for valid and null userIds', async () => {
      await expect(invalidateRecommendations('user_xyz789')).resolves.not.toThrow();
      await expect(invalidateRecommendations(null)).resolves.not.toThrow();
      await expect(invalidateRecommendations(undefined)).resolves.not.toThrow();
    });
  });
});
