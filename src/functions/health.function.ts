import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { BlobStorageService } from '../shared/blob';
import { createLogger } from '../shared/logger';
import { createSuccessResponse, getRequestId, handleOptionsRequest } from '../shared/http';
import { env } from '../config/env';
import { HealthStatus } from '../schemas/health.dto';

async function healthCheck(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const requestId = getRequestId(request);
  const logger = createLogger({ requestId, operation: 'health' });

  if (request.method === 'OPTIONS') {
    return handleOptionsRequest(requestId);
  }

  const startTime = Date.now();
  let overallStatus: 'healthy' | 'unhealthy' = 'healthy';

  // Check Azure Blob Storage connectivity
  let storageStatus: 'healthy' | 'unhealthy' = 'healthy';
  let storageMessage: string | undefined;

  try {
    const blobStorageService = new BlobStorageService(logger);
    
    // Try to list containers to verify connectivity
    const serviceClient = (blobStorageService as any).blobServiceClient;
    const containerIterator = serviceClient.listContainers();
    await containerIterator.next();
    
    storageStatus = 'healthy';
    logger.debug('Storage health check passed');
  } catch (error) {
    storageStatus = 'unhealthy';
    storageMessage = error instanceof Error ? error.message : 'Unknown storage error';
    overallStatus = 'unhealthy';
    logger.warn('Storage health check failed', { error: storageMessage });
  }

  const healthStatus: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: env.NODE_ENV,
    services: {
      storage: {
        status: storageStatus,
        message: storageMessage,
      },
    },
    uptime: process.uptime(),
  };

  const responseTime = Date.now() - startTime;
  logger.info('Health check completed', {
    status: overallStatus,
    responseTime,
    storageStatus,
  });

  const statusCode = overallStatus === 'healthy' ? 200 : 503;

  return {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': requestId,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
    jsonBody: createSuccessResponse(healthStatus, requestId),
  };
}

app.http('health', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'health',
  handler: healthCheck,
});