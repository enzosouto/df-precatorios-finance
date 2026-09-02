import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { requireAuth } from '../middleware/auth';
import {
  createTransactionSchema,
  listTransactionsQuerySchema,
  updateTransactionSchema,
} from '../validators/transactions.validators';
import {
  createTransaction,
  getTransactionById,
  listTransactions,
  softDeleteTransaction,
  updateTransaction,
} from '../services/transactions.service';

export const transactionsRouter = Router();

transactionsRouter.use(requireAuth);

transactionsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = listTransactionsQuerySchema.parse(req.query);
    const result = await listTransactions(req.userId as string, query);
    res.status(200).json(result);
  })
);

transactionsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = createTransactionSchema.parse(req.body);
    const transaction = await createTransaction(req.userId as string, input);
    res.status(201).json(transaction);
  })
);

transactionsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const transaction = await getTransactionById(req.userId as string, req.params.id);
    res.status(200).json(transaction);
  })
);

transactionsRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const input = updateTransactionSchema.parse(req.body);
    const transaction = await updateTransaction(req.userId as string, req.params.id, input);
    res.status(200).json(transaction);
  })
);

transactionsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await softDeleteTransaction(req.userId as string, req.params.id);
    res.status(204).send();
  })
);
