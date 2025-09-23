import { z } from 'zod';
import { containerNameSchema, blobNameSchema } from '../pipes/validation';

export const fileParamsSchema = z.object({
  container: containerNameSchema,
  blobPath: blobNameSchema,
});

export const downloadQuerySchema = z.object({
  download: z
    .string()
    .optional()
    .default('false')
    .transform((val) => val === '1' || val === 'true'),
});

export type FileParams = z.infer<typeof fileParamsSchema>;
export type DownloadQuery = z.infer<typeof downloadQuerySchema>;
