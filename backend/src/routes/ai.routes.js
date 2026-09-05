const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const validateRequest = require('../middleware/validateRequest');
const authMiddleware = require('../middleware/authMiddleware');
const { aiAskSchema } = require('../validators/schemas');
const { rateLimit, MemoryStore } = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { redisClient, isRedisConnected } = require('../config/redis');

let store = new MemoryStore();
let limiterOptions = null;

// Watch the shared redisClient for changes via a listener or just rely on it when initializing
redisClient.on('connect', () => {
  store = new RedisStore({ sendCommand: (...args) => redisClient.call(...args) });
  if (limiterOptions && store.init) store.init(limiterOptions);
});
redisClient.on('error', () => {
  store = new MemoryStore(); // Fallback to memory
  if (limiterOptions && store.init) store.init(limiterOptions);
});

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  store: {
     // Forward commands to the active store (Redis or Memory)
     init: (options) => { limiterOptions = options; if (store.init) store.init(options); },
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
