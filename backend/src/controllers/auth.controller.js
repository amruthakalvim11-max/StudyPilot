const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Email already exists' } });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email: normalizedEmail, passwordHash }
    });

    const token = generateToken(user);
    
    // Don't return passwordHash
    const { passwordHash: _, ...safeUser } = user;
    
    res.status(201).json({ success: true, data: { user: safeUser, token } });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
    }

    const token = generateToken(user);
    const { passwordHash: _, ...safeUser } = user;

    res.json({ success: true, data: { user: safeUser, token } });
  } catch (error) {
    next(error);
  }
};

exports.googleLogin = async (req, res, next) => {
  try {
    const { token } = req.body;
    
    if (!process.env.GOOGLE_CLIENT_ID) {
      // Mock flow if no Google Client ID is configured (for educational purposes / local dev without credentials)
      return res.status(501).json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Google OAuth credentials not configured.' } });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const normalizedEmail = payload.email.toLowerCase();

    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: payload.name,
          email: normalizedEmail,
          passwordHash: 'oauth_user', // dummy hash since they use OAuth
        }
      });
    }

    const jwtToken = generateToken(user);
    const { passwordHash: _, ...safeUser } = user;

    res.json({ success: true, data: { user: safeUser, token: jwtToken } });
  } catch (error) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid Google token' } });
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    }
    
    const { passwordHash: _, ...safeUser } = user;
    res.json({ success: true, data: safeUser });
  } catch (error) {
    next(error);
  }
};
