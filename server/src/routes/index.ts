import { Router } from 'express';
import healthRouter from './health.js';
import billsRouter from './bills.js';
import lawsRouter from './laws.js';
import authRouter from './auth.js';

const router = Router();

// Route handlers matching URL paths:
// /api/health -> ./health.ts
router.use('/health', healthRouter);

// /api/bills -> ./bills.ts
router.use('/bills', billsRouter);

// /api/laws -> ./laws.ts
router.use('/laws', lawsRouter);

// /api/auth -> ./auth.ts
router.use('/auth', authRouter);

export default router;
