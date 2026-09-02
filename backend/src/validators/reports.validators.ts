import { z } from 'zod';
import { dateOnlySchema } from './transactions.validators';

export const dateRangeQuerySchema = z.object({
  startDate: dateOnlySchema.optional(),
  endDate: dateOnlySchema.optional(),
});

export type DateRangeQuery = z.infer<typeof dateRangeQuerySchema>;
