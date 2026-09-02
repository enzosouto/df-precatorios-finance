import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { dateRangeQuerySchema } from '../validators/reports.validators';
import { getDashboardSummary } from '../services/dashboard.service';

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = dateRangeQuerySchema.parse(req.query);
    const summary = await getDashboardSummary(req.userId as string, startDate, endDate);
    res.status(200).json(summary);
  })
);
