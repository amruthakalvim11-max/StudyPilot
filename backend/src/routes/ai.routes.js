const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const validateRequest = require('../middleware/validateRequest');
const authMiddleware = require('../middleware/authMiddleware');
const { aiAskSchema } = require('../validators/schemas');
const { rateLimit, MemoryStore } = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { default: Redis } = require('ioredis');

// Setup Redis client for Rate Limiting (Graceful Fallback)
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 1,
  retryStrategy: (times) => {
    if (times > 1) return null;
    return Math.min(times * 50, 2000);
  }
});
let store = new MemoryStore();
let isRedisConnected = false;

redisClient.on('connect', () => {
  isRedisConnected = true;
  store = new RedisStore({ sendCommand: (...args) => redisClient.call(...args) });
});
redisClient.on('error', () => {
  isRedisConnected = false;
  store = new MemoryStore();
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Strict limit: 20 AI queries per 15 mins per user
  standardHeaders: true,
  legacyHeaders: false,
  store: {
     init: (options) => store.init && store.init(options),
     increment: (key) => store.increment(key),
     decrement: (key) => store.decrement(key),
     resetKey: (key) => store.resetKey(key),
  },
  handler: (req, res) => {
    res.status(429).json({ success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'You have exhausted your AI credits for this timeframe.' } });
  }
});

// Protect all AI routes with JWT
router.use(authMiddleware);

// POST /api/ai/ask
router.post('/ask', aiLimiter, validateRequest(aiAskSchema), aiController.askAi);

// POST /api/ai/ask/stream
router.post('/ask/stream', aiLimiter, validateRequest(aiAskSchema), aiController.askAiStream);

// Get AI usage metadata and cost estimates
router.get('/usage', authMiddleware, aiController.getUsage);

module.exports = router;
