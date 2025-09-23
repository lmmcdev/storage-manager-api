import { z } from 'zod';

const containerNameSchema = z
  .string()
  .min(3)
  .max(63)
  .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);

export const listQuerySchema = z.object({
  container: containerNameSchema.optional(),
  prefix: z.string().optional(),
  max: z.coerce.number().min(1).max(5000).default(100),
  continuationToken: z.string().optional(),
});

export type ListQuery = z.infer<typeof listQuerySchema>;
