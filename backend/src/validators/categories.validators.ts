import { z } from 'zod';

export const transactionTypeSchema = z.enum(['RECEITA', 'DESPESA'], {
  errorMap: () => ({ message: 'Tipo deve ser RECEITA ou DESPESA.' }),
});

export const createCategorySchema = z.object({
  name: z
    .string({ required_error: 'Nome é obrigatório.' })
    .trim()
    .min(1, 'Nome é obrigatório.'),
  type: transactionTypeSchema,
});

export const updateCategorySchema = z.object({
  name: z
    .string({ required_error: 'Nome é obrigatório.' })
    .trim()
    .min(1, 'Nome é obrigatório.'),
});

export const listCategoriesQuerySchema = z.object({
  type: transactionTypeSchema.optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
