const redisModule = require('../config/redis');

class CacheService {
  /**
   * Generates a safe user-scoped cache key
   * @param {string} entity - e.g. 'courses'
   * @param {string} userId - The authenticated user ID
   * @returns {string} - The safely formatted key
   */
  generateUserKey(entity, userId) {
    if (!userId) throw new Error('User ID is required for user-scoped cache keys.');
    return `studypilot:${entity}:user:${userId}`;
  }

  /**
   * Retrieves and parses JSON from Redis
   * @param {string} key
   * @returns {Promise<any|null>} - Parsed object or null on miss/error
   */
  async get(key) {
    if (!redisModule.isRedisConnected()) return null;

    try {
      const data = await redisModule.redisClient.get(key);
      if (!data) return null;

      try {
        return JSON.parse(data);
      } catch (parseError) {
        console.error(`[CacheService] Corrupted JSON for key ${key}. Evicting.`);
        // If data is corrupted, delete it and treat as cache miss
        await this.delete(key);
        return null;
      }
    } catch (error) {
      console.error(`[CacheService] GET error for key ${key}:`, error.message);
      return null; // Graceful fallback
    }
  }

  /**
   * Stringifies and stores JSON in Redis with a TTL
   * @param {string} key
   * @param {any} value
   * @param {number} ttlSeconds - Time to live in seconds
   */
  async set(key, value, ttlSeconds) {
    if (!redisModule.isRedisConnected()) return;

    try {
      const serialized = JSON.stringify(value);
      await redisModule.redisClient.set(key, serialized, 'EX', ttlSeconds);
    } catch (error) {
      console.error(`[CacheService] SET error for key ${key}:`, error.message);
      // Fail silently to not break the primary DB operation response
    }
  }

  /**
   * Deletes a key from Redis
   * @param {string} key
   */
  async delete(key) {
    if (!redisModule.isRedisConnected()) return;

    try {
      await redisModule.redisClient.del(key);
    } catch (error) {
      console.error(`[CacheService] DELETE error for key ${key}:`, error.message);
    }
  }

  /**
   * Cache-aside pattern orchestrator.
   * If cache misses, calls the fetcher function, caches the result, and returns it.
   * @param {string} key
   * @param {number} ttlSeconds
   * @param {Function} fetcher - Async function returning the data
   */
  async cacheAside(key, ttlSeconds, fetcher) {
    // 1. Try Cache
    const cachedData = await this.get(key);
    if (cachedData !== null) {
      return cachedData;
    }

    // 2. Cache Miss: Fetch from source
    const freshData = await fetcher();

    // 3. Populate Cache asynchronously
    // We don't await this so the response can be returned immediately to the client
    this.set(key, freshData, ttlSeconds).catch(err => {
       console.error(`[CacheService] Background SET error for key ${key}:`, err.message);
    });

    return freshData;
  }
}

module.exports = new CacheService();
