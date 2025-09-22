import { z } from 'zod';
import { containerNameSchema, blobNameSchema } from '../shared/validation';

export const fileParamsSchema = z.object({
  container: containerNameSchema,
  blobPath: blobNameSchema,
});

export const downloadQuerySchema = z.object({
  download: z.union([z.string(), z.undefined()]).transform(val => val === '1' || val === 'true').default(false),
});

export type FileParams = z.infer<typeof fileParamsSchema>;
export type DownloadQuery = z.infer<typeof downloadQuerySchema>;