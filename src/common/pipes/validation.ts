import { z } from 'zod';
import { BadRequestError } from '../exceptions/errors';

export function validateBody<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown,
  requestId: string
): z.infer<T> {
  try {
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.errors.reduce(
        (acc, err) => {
          const path = err.path.join('.');
          acc[path] = err.message;
          return acc;
        },
        {} as Record<string, string>
      );

      throw new BadRequestError('Validation failed', requestId, {
        validationErrors: details,
      });
    }
    throw error;
  }
}

export function validateQuery<T extends z.ZodTypeAny>(
  schema: T,
  query: URLSearchParams,
  requestId: string
): z.infer<T> {
  try {
    const queryObject = Object.fromEntries(query.entries());
    return schema.parse(queryObject);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.errors.reduce(
        (acc, err) => {
          const path = err.path.join('.');
          acc[path] = err.message;
          return acc;
        },
        {} as Record<string, string>
      );

      throw new BadRequestError('Query validation failed', requestId, {
        validationErrors: details,
      });
    }
    throw error;
  }
}

export function validateParams<T extends z.ZodTypeAny>(
  schema: T,
  params: Record<string, string>,
  requestId: string
): z.infer<T> {
  try {
    return schema.parse(params);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.errors.reduce(
        (acc, err) => {
          const path = err.path.join('.');
          acc[path] = err.message;
          return acc;
        },
        {} as Record<string, string>
      );

      throw new BadRequestError('Path parameter validation failed', requestId, {
        validationErrors: details,
      });
    }
    throw error;
  }
}

export const containerNameSchema = z
  .string()
  .min(3, 'Container name must be at least 3 characters')
  .max(63, 'Container name must be at most 63 characters')
  .regex(
    /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
    'Container name must contain only lowercase letters, numbers, and hyphens'
  );

export const blobNameSchema = z
  .string()
  .min(1, 'Blob name cannot be empty')
  .max(1024, 'Blob name must be at most 1024 characters')
  .refine(
    (name) => !name.includes('//'),
    'Blob name cannot contain consecutive slashes'
  )
  .refine((name) => !name.startsWith('/'), 'Blob name cannot start with slash')
  .refine((name) => !name.endsWith('/'), 'Blob name cannot end with slash');

export const metadataSchema = z
  .record(z.string(), z.string())
  .refine((metadata) => {
    const keys = Object.keys(metadata);
    return keys.every((key) => /^[a-zA-Z][a-zA-Z0-9_]*$/.test(key));
  }, 'Metadata keys must start with letter and contain only alphanumeric characters and underscores')
  .refine((metadata) => {
    const keys = Object.keys(metadata);
    return keys.length <= 50;
  }, 'Maximum 50 metadata entries allowed');
