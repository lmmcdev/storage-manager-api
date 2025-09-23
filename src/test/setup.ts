import { validateRequiredEnv } from '../common/config/env';

process.env.NODE_ENV = 'test';
process.env.AUTH_MODE = 'apikey';
process.env.API_KEYS = 'test-key-1,test-key-2';
process.env.AZURE_STORAGE_CONNECTION_STRING =
  'DefaultEndpointsProtocol=https;AccountName=testaccount;AccountKey=dGVzdEFjY291bnRLZXkxMjM0NTY3ODkwQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVo=;EndpointSuffix=core.windows.net';
process.env.AZURE_STORAGE_CONTAINER_DEFAULT = 'test-uploads';
process.env.AZURE_TENANT_ID = 'test-tenant-id';
process.env.AZURE_CLIENT_ID = 'test-client-id';
process.env.AZURE_CLIENT_SECRET = 'test-client-secret';
process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.LOG_LEVEL = 'error';
process.env.REDACT_SECRETS = 'true';

// Import mocks to set them up
import './mocks/azure.mocks';

try {
  validateRequiredEnv();
} catch (error) {
  console.warn('Environment validation failed in test setup:', error);
}
