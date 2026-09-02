import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { requireAuth } from '../middleware/auth';
import {
  createPrecatorioSchema,
  listPrecatoriosQuerySchema,
  updatePrecatorioSchema,
} from '../validators/precatorios.validators';
import {
  createPrecatorio,
  getPrecatorioById,
  listPrecatorios,
  softDeletePrecatorio,
  updatePrecatorio,
} from '../services/precatorios.service';

export const precatoriosRouter = Router();

precatoriosRouter.use(requireAuth);

precatoriosRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = listPrecatoriosQuerySchema.parse(req.query);
    const result = await listPrecatorios(req.userId as string, query);
    res.status(200).json(result);
  })
);

precatoriosRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = createPrecatorioSchema.parse(req.body);
    const precatorio = await createPrecatorio(req.userId as string, input);
    res.status(201).json(precatorio);
  })
);

precatoriosRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const precatorio = await getPrecatorioById(req.userId as string, req.params.id);
    res.status(200).json(precatorio);
  })
);

precatoriosRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const input = updatePrecatorioSchema.parse(req.body);
    const precatorio = await updatePrecatorio(req.userId as string, req.params.id, input);
    res.status(200).json(precatorio);
  })
);

precatoriosRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await softDeletePrecatorio(req.userId as string, req.params.id);
    res.status(204).send();
  })
);
