import { z } from 'zod';

const containerNameSchema = z
  .string()
  .min(3)
  .max(63)
  .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
const blobNameSchema = z.string().min(1).max(1024);
const metadataSchema = z.record(z.string()).optional();

export const copyBodySchema = z.object({
  source: z.object({
    container: containerNameSchema,
    blobName: blobNameSchema,
  }),
  target: z.object({
    container: containerNameSchema,
    blobName: blobNameSchema,
  }),
  move: z.boolean().default(false),
  metadata: metadataSchema,
});

export type CopyRequest = z.infer<typeof copyBodySchema>;
