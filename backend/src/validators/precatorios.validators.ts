import { z } from 'zod';

const POSITIVE_AMOUNT_REGEX = /^\d+(\.\d{1,2})?$/;

const positiveAmountSchema = z
  .string({ required_error: 'Valor é obrigatório.' })
  .regex(POSITIVE_AMOUNT_REGEX, 'Valor deve ser um número decimal válido, ex: "1500.00".')
  .refine((value) => Number(value) > 0, 'Valor deve ser maior que zero.');

const nonNegativeAmountSchema = z
  .string()
  .regex(POSITIVE_AMOUNT_REGEX, 'Valor deve ser um número decimal válido, ex: "1500.00".')
  .refine((value) => Number(value) >= 0, 'Valor deve ser maior ou igual a zero.');

const cedenteSchema = z
  .string({ required_error: 'Cedente é obrigatório.' })
  .trim()
  .min(1, 'Cedente é obrigatório.');

export const createPrecatorioSchema = z.object({
  cedente: cedenteSchema,
  valorOriginal: positiveAmountSchema,
  valorAtualizado: positiveAmountSchema,
  valorPago: z.union([nonNegativeAmountSchema, z.null()]).optional(),
});

export const updatePrecatorioSchema = z
  .object({
    cedente: cedenteSchema,
    valorOriginal: positiveAmountSchema,
    valorAtualizado: positiveAmountSchema,
    valorPago: z.union([nonNegativeAmountSchema, z.null()]),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Nenhum dado para atualizar foi enviado.',
  });

export const listPrecatoriosQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(200).optional().default(20),
});

export type CreatePrecatorioInput = z.infer<typeof createPrecatorioSchema>;
export type UpdatePrecatorioInput = z.infer<typeof updatePrecatorioSchema>;
export type ListPrecatoriosQuery = z.infer<typeof listPrecatoriosQuerySchema>;
