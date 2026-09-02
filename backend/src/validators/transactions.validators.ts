import { z } from 'zod';
import { isValidDateOnlyString } from '../lib/dateOnly';
import { transactionTypeSchema } from './categories.validators';

const AMOUNT_REGEX = /^\d+(\.\d{1,2})?$/;

export const amountSchema = z
  .string({ required_error: 'Valor é obrigatório.' })
  .regex(AMOUNT_REGEX, 'Valor deve ser um número decimal válido, ex: "1500.00".')
  .refine((value) => Number(value) > 0, 'Valor deve ser maior que zero.');

export const dateOnlySchema = z
  .string({ required_error: 'Data é obrigatória.' })
  .refine(isValidDateOnlyString, 'Data inválida. Utilize o formato YYYY-MM-DD.');

/** Accepts a trimmed string or null/undefined. Emptiness/requiredness by type is checked separately. */
const clientNameFieldSchema = z.union([z.string().trim(), z.null()]).optional();

export const createTransactionSchema = z
  .object({
    type: transactionTypeSchema,
    amount: amountSchema,
    description: z
      .string({ required_error: 'Descrição é obrigatória.' })
      .trim()
      .min(1, 'Descrição é obrigatória.'),
    categoryId: z.string({ required_error: 'Categoria é obrigatória.' }).min(1, 'Categoria é obrigatória.'),
    transactionDate: dateOnlySchema,
    clientName: clientNameFieldSchema,
  })
  .superRefine((data, ctx) => {
    if (!data.clientName || data.clientName.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Informe o cliente/empresa.',
        path: ['clientName'],
      });
    }
  });

export const updateTransactionSchema = z
  .object({
    type: transactionTypeSchema,
    amount: amountSchema,
    description: z.string().trim().min(1, 'Descrição é obrigatória.'),
    categoryId: z.string().min(1, 'Categoria é obrigatória.'),
    transactionDate: dateOnlySchema,
    clientName: clientNameFieldSchema,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Nenhum dado para atualizar foi enviado.',
  });

export const listTransactionsQuerySchema = z.object({
  startDate: dateOnlySchema.optional(),
  endDate: dateOnlySchema.optional(),
  type: transactionTypeSchema.optional(),
  categoryId: z.string().min(1).optional(),
  search: z.string().optional(),
  clientName: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(200).optional().default(20),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type ListTransactionsQuery = z.infer<typeof listTransactionsQuerySchema>;
