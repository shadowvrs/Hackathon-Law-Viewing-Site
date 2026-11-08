import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { ApiResponse, User, AuthResponse, LoginRequest, RegisterRequest } from '@app/shared';
import { findUserByEmail, findUserById, createUser, toPublicUser } from '../../services/userService.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET ?? 'changeme_set_JWT_SECRET_in_env';
const JWT_EXPIRES_IN = '7d';

// ---------------------------------------------------------------------------
// POST /api/auth/register — create a new account
// ---------------------------------------------------------------------------
router.post(
  '/register',
  async (
    req: Request<Record<string, never>, ApiResponse<AuthResponse | null>, RegisterRequest>,
    res: Response
  ) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        data: null,
        message: 'Name, email, and password are required',
      });
      return;
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      res.status(409).json({
        success: false,
        data: null,
        message: 'An account with this email address already exists',
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await createUser(name, email, passwordHash);
    const publicUser = toPublicUser(user);
    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({
      success: true,
      data: { user: publicUser, token },
      message: 'Account created successfully',
    });
  }
);

// ---------------------------------------------------------------------------
// POST /api/auth/login — authenticate an existing account
// ---------------------------------------------------------------------------
router.post(
  '/login',
  async (
    req: Request<Record<string, never>, ApiResponse<AuthResponse | null>, LoginRequest>,
    res: Response
  ) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        data: null,
        message: 'Email and password are required',
      });
      return;
    }

    const user = await findUserByEmail(email);
    if (!user) {
      res.status(401).json({
        success: false,
        data: null,
        message: 'Invalid email or password',
      });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({
        success: false,
        data: null,
        message: 'Invalid email or password',
      });
      return;
    }

    const publicUser = toPublicUser(user);
    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({
      success: true,
      data: { user: publicUser, token },
      message: 'Logged in successfully',
    });
  }
);

// ---------------------------------------------------------------------------
// GET /api/auth/me — return the current session user from a JWT
// ---------------------------------------------------------------------------
router.get('/me', async (req: Request, res: Response<ApiResponse<User | null>>) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, data: null, message: 'Not authenticated' });
    return;
  }

  const token = authHeader.replace('Bearer ', '').trim();

  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
  } catch {
    res.status(401).json({ success: false, data: null, message: 'Invalid or expired token' });
    return;
  }

  const userId = payload.sub as string;
  const user = await findUserById(userId);
  if (!user) {
    res.status(404).json({ success: false, data: null, message: 'User not found' });
    return;
  }

  res.json({ success: true, data: toPublicUser(user) });
});

export default router;
