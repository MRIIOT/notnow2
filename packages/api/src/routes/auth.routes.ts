import { Router, type Request, type Response, type NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { Handle } from '../models/Handle.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { env } from '../config/env.js';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/authenticate.js';
import { signupSchema, loginSchema } from '../validators/auth.validators.js';
import { Errors } from '../utils/errors.js';

const router = Router();
const REFRESH_TOKEN_DAYS = 30;

function signAccessToken(userId: string, username: string): string {
  return jwt.sign({ userId, username }, env.JWT_SECRET, { expiresIn: '15m' });
}

async function createRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(40).toString('hex');
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ token, userId, expiresAt });
  return token;
}

function setRefreshCookie(res: Response, token: string) {
  const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

// POST /auth/signup
router.post('/signup', validate(signupSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password, displayName } = req.body;

    // Check handle availability
    const existing = await Handle.findOne({ handle: username });
    if (existing) throw Errors.handleTaken();

    const emailExists = await User.findOne({ email });
    if (emailExists) throw Errors.conflict('Email already in use');

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      username,
      email,
      passwordHash,
      displayName: displayName || username,
    });

    await Handle.create({ handle: username, type: 'user', refId: user._id });

    const accessToken = signAccessToken(user._id.toString(), user.username);
    const refreshToken = await createRefreshToken(user._id.toString());
    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      user: { id: user._id, username: user.username, email: user.email, displayName: user.displayName },
      accessToken,
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
router.post('/login', validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { emailOrUsername, password } = req.body;
    const cleaned = emailOrUsername.replace(/^@/, '').toLowerCase();

    const user = await User.findOne({
      $or: [{ email: cleaned }, { username: cleaned }],
    });
    if (!user) throw Errors.unauthorized('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw Errors.unauthorized('Invalid credentials');

    const accessToken = signAccessToken(user._id.toString(), user.username);
    const refreshToken = await createRefreshToken(user._id.toString());
    setRefreshCookie(res, refreshToken);

    res.json({
      user: { id: user._id, username: user.username, email: user.email, displayName: user.displayName },
      accessToken,
    });
  } catch (err) {
    next(err);
  }
});

// POST /auth/refresh
router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) throw Errors.unauthorized('No refresh token');

    const stored = await RefreshToken.findOneAndDelete({ token });
    if (!stored) throw Errors.unauthorized('Invalid refresh token');
    if (stored.expiresAt < new Date()) throw Errors.unauthorized('Refresh token expired');

    const user = await User.findById(stored.userId);
    if (!user) throw Errors.unauthorized('User not found');

    const accessToken = signAccessToken(user._id.toString(), user.username);
    const newRefreshToken = await createRefreshToken(user._id.toString());
    setRefreshCookie(res, newRefreshToken);

    res.json({ accessToken });
  } catch (err) {
    next(err);
  }
});

// POST /auth/logout
router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await RefreshToken.deleteOne({ token });
    }
    res.clearCookie('refreshToken', { path: '/' });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// GET /auth/me
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.userId).select('-passwordHash');
    if (!user) throw Errors.notFound('User');
    res.json({ user: { id: user._id, username: user.username, email: user.email, displayName: user.displayName } });
  } catch (err) {
    next(err);
  }
});

// GET /auth/check-handle/:handle
router.get('/check-handle/:handle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await Handle.findOne({ handle: (req.params.handle as string).toLowerCase() });
    res.json({ available: !existing });
  } catch (err) {
    next(err);
  }
});

// POST /auth/change-password
router.post('/change-password', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) throw Errors.validation('currentPassword and newPassword are required');
    if (newPassword.length < 6) throw Errors.validation('New password must be at least 6 characters');

    const user = await User.findById(req.user!.userId);
    if (!user) throw Errors.notFound('User');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw Errors.unauthorized('Current password is incorrect');

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
