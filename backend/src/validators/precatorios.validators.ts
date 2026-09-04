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

const documentoTipoSchema = z.enum(['PROCURACAO', 'ESCRITURA'], {
  invalid_type_error: 'Tipo de documento deve ser "PROCURACAO" ou "ESCRITURA".',
});

const documentoTipoFieldSchema = z.union([documentoTipoSchema, z.null()]).optional();
const numeroDocumentoFieldSchema = z.union([z.string().trim().min(1), z.null()]).optional();

const LIVRO_REGEX = /^\d+[A-Za-z]?$/;
const FOLHA_REGEX = /^\d+(-\d+)?$/;

const livroFieldSchema = z
  .union([
    z.string().trim().regex(LIVRO_REGEX, 'Livro deve ser um número, opcionalmente seguido de uma letra (ex: "42" ou "42A").'),
    z.null(),
  ])
  .optional();

const folhaFieldSchema = z
  .union([
    z.string().trim().regex(FOLHA_REGEX, 'Folha deve ser um número (ex: "15") ou um intervalo (ex: "15-17").'),
    z.null(),
  ])
  .optional();

const origemSchema = z.enum(['GDF', 'FEDERAL', 'OUTRO'], {
  required_error: 'Origem é obrigatória.',
  invalid_type_error: 'Origem deve ser "GDF", "FEDERAL" ou "OUTRO".',
});

const origemOutroFieldSchema = z.union([z.string().trim(), z.null()]).optional();

const compradorSchema = z.union([z.string().trim().min(1), z.null()]).optional();

function checkParFields(
  data: {
    tipoDocumento?: unknown;
    numeroDocumento?: unknown;
    livro?: unknown;
    folha?: unknown;
    origem?: unknown;
    origemOutro?: unknown;
  },
  ctx: z.RefinementCtx
): void {
  if (!!data.tipoDocumento !== !!data.numeroDocumento) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Informe o tipo e o número do documento juntos, ou deixe ambos em branco.',
      path: ['numeroDocumento'],
    });
  }
  if (!!data.livro !== !!data.folha) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Informe o livro e a folha do ato juntos, ou deixe ambos em branco.',
      path: ['folha'],
    });
  }
  if (data.origem === 'OUTRO' && (!data.origemOutro || String(data.origemOutro).trim().length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Descreva a origem quando selecionar "Outro".',
      path: ['origemOutro'],
    });
  }
}

const valorVendidoFieldSchema = z.union([nonNegativeAmountSchema, z.null()]).optional();
const comissoesFieldSchema = z.array(nonNegativeAmountSchema).optional();

export const createPrecatorioSchema = z
  .object({
    cedente: cedenteSchema,
    valorAtualizado: positiveAmountSchema,
    valorVendido: valorVendidoFieldSchema,
    valorPago: nonNegativeAmountSchema,
    comissoes: comissoesFieldSchema,
    tipoDocumento: documentoTipoFieldSchema,
    numeroDocumento: numeroDocumentoFieldSchema,
    livro: livroFieldSchema,
    folha: folhaFieldSchema,
    origem: origemSchema,
    origemOutro: origemOutroFieldSchema,
    comprador: compradorSchema,
  })
  .superRefine(checkParFields);

export const updatePrecatorioSchema = z
  .object({
    cedente: cedenteSchema,
    valorAtualizado: positiveAmountSchema,
    valorVendido: valorVendidoFieldSchema,
    valorPago: nonNegativeAmountSchema,
    comissoes: comissoesFieldSchema,
    tipoDocumento: documentoTipoFieldSchema,
    numeroDocumento: numeroDocumentoFieldSchema,
    livro: livroFieldSchema,
    folha: folhaFieldSchema,
    origem: origemSchema,
    origemOutro: origemOutroFieldSchema,
    comprador: compradorSchema,
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Nenhum dado para atualizar foi enviado.',
  });

export const listPrecatoriosQuerySchema = z.object({
  search: z.string().optional(),
  origem: origemSchema.optional(),
  comprador: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(1000).optional().default(20),
});

export type CreatePrecatorioInput = z.infer<typeof createPrecatorioSchema>;
export type UpdatePrecatorioInput = z.infer<typeof updatePrecatorioSchema>;
export type ListPrecatoriosQuery = z.infer<typeof listPrecatoriosQuerySchema>;
