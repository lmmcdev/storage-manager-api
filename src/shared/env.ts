import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  AZURE_STORAGE_ACCOUNT: z.string().optional(),
  AZURE_STORAGE_CONNECTION_STRING: z.string().optional(),
  AZURE_STORAGE_CONTAINER_DEFAULT: z.string().default('uploads'),
  AUTH_MODE: z.enum(['aad', 'apikey']).default('apikey'),
  API_KEYS: z.string().optional(),
  ALLOWED_ROLES: z.string().default('files.read,files.write,files.delete,files.sas'),
  CORS_ALLOWED_ORIGINS: z.string().default('*'),
  SAS_DEFAULT_EXP_SECONDS: z.string().transform(Number).default(900),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  REDACT_SECRETS: z.string().transform(val => val === 'true').default(true),
});

export type EnvConfig = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';
export const isTest = env.NODE_ENV === 'test';

export function getApiKeys(): string[] {
  if (!env.API_KEYS) return [];
  return env.API_KEYS.split(',').map(key => key.trim()).filter(Boolean);
}

export function getAllowedRoles(): string[] {
  return env.ALLOWED_ROLES.split(',').map(role => role.trim()).filter(Boolean);
}

export function getCorsOrigins(): string[] {
  if (env.CORS_ALLOWED_ORIGINS === '*') return ['*'];
  return env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean);
}

export function validateRequiredEnv(): void {
  if (env.AUTH_MODE === 'apikey' && !env.API_KEYS) {
    throw new Error('API_KEYS environment variable is required when AUTH_MODE is "apikey"');
  }

  if (!env.AZURE_STORAGE_CONNECTION_STRING && !env.AZURE_STORAGE_ACCOUNT) {
    throw new Error('Either AZURE_STORAGE_CONNECTION_STRING or AZURE_STORAGE_ACCOUNT must be provided');
  }
}