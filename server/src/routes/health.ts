import { Router, Request, Response } from 'express';
import type { HealthCheckResponse } from '@app/shared';
import { loadBills } from '../services/billService.js';

const router = Router();

// GET /api/health
router.get('/', (_req: Request, res: Response<HealthCheckResponse>) => {
  const bills = loadBills();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    billCount: bills.length,
  });
});

export default router;
