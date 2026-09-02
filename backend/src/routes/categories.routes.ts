import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { requireAuth } from '../middleware/auth';
import {
  createCategorySchema,
  listCategoriesQuerySchema,
  updateCategorySchema,
} from '../validators/categories.validators';
import { createCategory, listCategories, updateCategory } from '../services/categories.service';

export const categoriesRouter = Router();

categoriesRouter.use(requireAuth);

categoriesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const { type } = listCategoriesQuerySchema.parse(req.query);
    const categories = await listCategories(req.userId as string, type);
    res.status(200).json(categories);
  })
);

categoriesRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, type } = createCategorySchema.parse(req.body);
    const category = await createCategory(req.userId as string, name, type);
    res.status(201).json(category);
  })
);

categoriesRouter.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const { name } = updateCategorySchema.parse(req.body);
    const category = await updateCategory(req.userId as string, req.params.id, name);
    res.status(200).json(category);
  })
);
