import { z } from 'zod';
import { containerNameSchema } from '../shared/validation';

export const listQuerySchema = z.object({
  container: containerNameSchema.optional(),
  prefix: z.string().optional(),
  max: z.string().transform(Number).refine(val => val > 0 && val <= 1000, {
    message: 'Max must be between 1 and 1000',
  }).default('100'),
  continuationToken: z.string().optional(),
});

export const listParamsSchema = z.object({
  container: containerNameSchema.optional(),
});

export type ListQuery = z.infer<typeof listQuerySchema>;
export type ListParams = z.infer<typeof listParamsSchema>;