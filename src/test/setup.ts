import { validateRequiredEnv } from '../shared/env';

process.env.NODE_ENV = 'test';
process.env.AUTH_MODE = 'apikey';
process.env.API_KEYS = 'test-key-1,test-key-2';
process.env.AZURE_STORAGE_CONNECTION_STRING = 'DefaultEndpointsProtocol=https;AccountName=test;AccountKey=dGVzdA==;EndpointSuffix=core.windows.net';
process.env.AZURE_STORAGE_CONTAINER_DEFAULT = 'test-uploads';
process.env.LOG_LEVEL = 'error';
process.env.REDACT_SECRETS = 'true';

try {
  validateRequiredEnv();
} catch (error) {
  console.warn('Environment validation failed in test setup:', error);
}