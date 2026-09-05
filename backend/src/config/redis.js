const { default: Redis } = require('ioredis');

// Setup Centralized Redis client (Graceful Fallback)
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 1,
  retryStrategy: (times) => {
    if (times > 1) return null; // stop retrying
    return Math.min(times * 50, 2000);
  }
});

let isRedisConnected = false;

redisClient.on('connect', () => {
  isRedisConnected = true;
});

redisClient.on('error', (err) => {
  if (isRedisConnected) {
    console.log('Redis disconnected. Falling back to safe modes.');
  }
  isRedisConnected = false;
});

// Export client and a method to check connectivity safely
module.exports = {
  redisClient,
  isRedisConnected: () => isRedisConnected
};
