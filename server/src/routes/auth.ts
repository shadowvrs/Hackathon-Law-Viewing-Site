import { Router, Request, Response } from 'express';
import type { ApiResponse, User, AuthResponse, LoginRequest, RegisterRequest } from '@app/shared';
import { createUser, findUserByEmail, findUserById, toPublicUser, type StoredUser } from '../services/userService.js';

const router = Router();

// POST /api/auth/login - Authenticate existing user
router.post(
  '/login',
  async (req: Request<Record<string, never>, ApiResponse<AuthResponse | null>, LoginRequest>, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        data: null,
        message: 'Email and password are required',
      });
      return;
    }

    const user = await findUserByEmail(email.trim())

    if (!user || user.passwordHash !== password) {
      res.status(401).json({
        success: false,
        data: null,
        message: 'Invalid email or password',
      });
      return;
    }

    const publicUser = toPublicUser(user);
    res.json({
      success: true,
      data: {
        user: publicUser,
        token: `mock_jwt_token_${user.id}_${Date.now()}`,
      },
      message: 'Logged in successfully',
    });
  }
);

// POST /api/auth/register - Register a new user
router.post(
  '/register',
  async (req: Request<Record<string, never>, ApiResponse<AuthResponse | null>, RegisterRequest>, res: Response) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        data: null,
        message: 'Name, email, and password are required',
      });
      return;
    }
    const normalizedEmail = email.trim()
    const existing = await findUserByEmail(email.trim());
    if (existing) {

      res.status(409).json({
        success: false,
        data: null,
        message: 'An account with this email address already exists',
      })
      return
    }

    const newUser = await createUser(name, normalizedEmail, password)

    res.status(201).json({
      success: true,
      data: {
        user: toPublicUser(newUser),
        token: `mock_jwt_token_${newUser.id}_${Date.now()}`,
      },
      message: 'Account created successfully',
    });
  }
);

// GET /api/auth/me - Retrieve current session user
router.get('/me', async (req: Request, res: Response<ApiResponse<User | null>>) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      data: null,
      message: 'Not authenticated',
    });
    return;
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const match = token.match(/^mock_jwt_token_(usr_[^_]+)/);
  if (!match) {
    res.status(401).json({
      success: false,
      data: null,
      message: 'Invalid session token',
    });
    return;
  }

  const userId = match[1]
  const user = await findUserById(userId)

  if (!user) {
    res.status(404).json({
      success: false,
      data: null,
      message: 'User session not found',
    });
    return;
  }

  res.json({
    success: true,
    data: toPublicUser(user),
  });
});

export default router;
