import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { healthRouter } from './routes/health.routes';
import { authRouter } from './routes/auth.routes';
import { categoriesRouter } from './routes/categories.routes';
import { transactionsRouter } from './routes/transactions.routes';
import { precatoriosRouter } from './routes/precatorios.routes';
import { dashboardRouter } from './routes/dashboard.routes';
import { reportsRouter } from './routes/reports.routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  app.use('/health', healthRouter);
  app.use('/auth', authRouter);
  app.use('/categories', categoriesRouter);
  app.use('/transactions', transactionsRouter);
  app.use('/precatorios', precatoriosRouter);
  app.use('/dashboard', dashboardRouter);
  app.use('/reports', reportsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
