import { z } from 'zod';

const containerNameSchema = z
  .string()
  .min(3)
  .max(63)
  .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
const blobNameSchema = z.string().min(1).max(1024);

export const fileParamsSchema = z.object({
  container: containerNameSchema,
  blobPath: blobNameSchema,
});

export const downloadQuerySchema = z.object({
  download: z.coerce.boolean().default(false),
});

export type FileParams = z.infer<typeof fileParamsSchema>;
export type DownloadQuery = z.infer<typeof downloadQuerySchema>;
