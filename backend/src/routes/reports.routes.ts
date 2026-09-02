import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { dateRangeQuerySchema } from '../validators/reports.validators';
import { getReports } from '../services/reports.service';

export const reportsRouter = Router();

reportsRouter.use(requireAuth);

reportsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { startDate, endDate } = dateRangeQuerySchema.parse(req.query);
    const report = await getReports(req.userId as string, startDate, endDate);
    res.status(200).json(report);
  })
);
