import { z } from 'zod';

const containerNameSchema = z
  .string()
  .min(3)
  .max(63)
  .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
const blobNameSchema = z.string().min(1).max(1024);

export const sasQuerySchema = z.object({
  permissions: z
    .string()
    .regex(/^[rwdlac]+$/, 'Invalid permissions format')
    .default('r'),
  expiresInSeconds: z.coerce.number().min(60).max(86400).default(3600),
});

export const sasParamsSchema = z.object({
  container: containerNameSchema,
  blobPath: blobNameSchema,
});

export type SasQuery = z.infer<typeof sasQuerySchema>;
export type SasParams = z.infer<typeof sasParamsSchema>;
