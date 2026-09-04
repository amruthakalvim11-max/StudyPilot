const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validateRequest = require('../middleware/validateRequest');
const authMiddleware = require('../middleware/authMiddleware');
const { registerSchema, loginSchema } = require('../validators/schemas');
const { rateLimit, MemoryStore } = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { default: Redis } = require('ioredis');

// Setup Redis client for Rate Limiting (Graceful Fallback)
const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 1,
  retryStrategy: (times) => {
    if (times > 1) return null; // stop retrying
    return Math.min(times * 50, 2000);
  }
});
let store = new MemoryStore();
let isRedisConnected = false;

redisClient.on('connect', () => {
  isRedisConnected = true;
  store = new RedisStore({ sendCommand: (...args) => redisClient.call(...args) });
});
redisClient.on('error', (err) => {
  if (isRedisConnected) {
    console.log('Redis disconnected. Falling back to memory store.');
  }
  isRedisConnected = false;
  store = new MemoryStore(); // Fallback to memory
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  store: {
     // Forward commands to the active store (Redis or Memory)
     init: (options) => store.init && store.init(options),
     increment: (key) => store.increment(key),
     decrement: (key) => store.decrement(key),
     resetKey: (key) => store.resetKey(key),
  },
  handler: (req, res) => {
    res.status(429).json({ success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many authentication attempts, please try again later.' } });
  }
});

router.post('/register', authLimiter, validateRequest(registerSchema), authController.register);
router.post('/login', authLimiter, validateRequest(loginSchema), authController.login);
router.post('/google', authLimiter, authController.googleLogin);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
