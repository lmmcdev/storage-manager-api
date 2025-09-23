import { z } from 'zod';

const containerNameSchema = z
  .string()
  .min(3)
  .max(63)
  .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
const blobNameSchema = z.string().min(1).max(1024);
const metadataSchema = z.record(z.string()).optional();

export const uploadFormDataSchema = z.object({
  container: containerNameSchema.optional(),
  path: z.string().optional(),
  metadata: z
    .string()
    .transform((val, ctx) => {
      try {
        return JSON.parse(val);
      } catch {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid JSON in metadata field',
        });
        return z.NEVER;
      }
    })
    .pipe(metadataSchema)
    .optional(),
});

export const uploadJsonSchema = z.object({
  contentBase64: z.string().min(1, 'Content cannot be empty'),
  filename: z.string().min(1, 'Filename is required'),
  contentType: z.string().min(1, 'Content type is required'),
  container: containerNameSchema.optional(),
  path: z.string().optional(),
  metadata: metadataSchema.optional(),
});

export const uploadParamsSchema = z.object({
  container: containerNameSchema.optional(),
  blobPath: blobNameSchema.optional(),
});

export type UploadFormData = z.infer<typeof uploadFormDataSchema>;
export type UploadJsonRequest = z.infer<typeof uploadJsonSchema>;
export type UploadParams = z.infer<typeof uploadParamsSchema>;
