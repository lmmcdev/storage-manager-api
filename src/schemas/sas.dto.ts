import { z } from 'zod';
import { containerNameSchema, blobNameSchema } from '../shared/validation';

export const sasRequestSchema = z.object({
  container: containerNameSchema,
  blobName: blobNameSchema,
  permissions: z.enum(['r', 'w', 'rw', 'd', 'rd', 'wd', 'rwd'], {
    errorMap: () => ({ message: 'Permissions must be one of: r, w, rw, d, rd, wd, rwd' }),
  }),
  expiresInSeconds: z.number().min(60, 'Minimum expiration is 60 seconds').max(86400, 'Maximum expiration is 24 hours').default(900),
});

export type SasRequest = z.infer<typeof sasRequestSchema>;