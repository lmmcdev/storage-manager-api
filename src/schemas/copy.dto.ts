import { z } from 'zod';
import { containerNameSchema, blobNameSchema, metadataSchema } from '../shared/validation';

export const copyRequestSchema = z.object({
  source: z.object({
    container: containerNameSchema,
    blobName: blobNameSchema,
  }),
  target: z.object({
    container: containerNameSchema,
    blobName: blobNameSchema,
  }),
  move: z.boolean().default(false),
  metadata: metadataSchema.optional(),
});

export type CopyRequest = z.infer<typeof copyRequestSchema>;