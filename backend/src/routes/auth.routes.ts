import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler } from '../lib/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { clearAuthCookie, setAuthCookie } from '../lib/cookies';
import { signToken } from '../lib/jwt';
import { changePasswordSchema, loginSchema } from '../validators/auth.validators';
import { authenticate, changePassword, getUserById } from '../services/auth.service';

export const authRouter = Router();

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : 'unknown';
    return `${req.ip}:${email}`;
  },
  handler: (_req, res) => {
    res.status(429).json({ error: 'Muitas tentativas. Tente novamente mais tarde.' });
  },
});

authRouter.post(
  '/login',
  loginRateLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const { user, userId } = await authenticate(email, password);

    const token = signToken({ sub: userId });
    setAuthCookie(res, token);

    res.status(200).json({ user });
  })
);

authRouter.post('/logout', (_req, res) => {
  clearAuthCookie(res);
  res.status(200).json({});
});

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await getUserById(req.userId as string);
    res.status(200).json({ user });
  })
);

authRouter.put(
  '/password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
    await changePassword(req.userId as string, currentPassword, newPassword);
    res.status(200).json({});
  })
);
