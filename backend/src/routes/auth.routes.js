const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validateRequest = require('../middleware/validateRequest');
const authMiddleware = require('../middleware/authMiddleware');
const { registerSchema, loginSchema } = require('../validators/schemas');
const { rateLimit, MemoryStore } = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const { redisClient, isRedisConnected } = require('../config/redis');

let store = new MemoryStore();
let limiterOptions = null;

redisClient.on('connect', () => {
  store = new RedisStore({ sendCommand: (...args) => redisClient.call(...args) });
  if (limiterOptions && store.init) store.init(limiterOptions);
});
redisClient.on('error', () => {
  store = new MemoryStore(); // Fallback to memory
  if (limiterOptions && store.init) store.init(limiterOptions);
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per window
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
    res.status(429).json({ success: false, error: { code: 'TOO_MANY_REQUESTS', message: 'Too many authentication attempts, please try again later.' } });
  }
});

router.post('/register', authLimiter, validateRequest(registerSchema), authController.register);
router.post('/login', authLimiter, validateRequest(loginSchema), authController.login);
router.post('/google', authLimiter, authController.googleLogin);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
