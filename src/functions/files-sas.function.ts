import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { BlobStorageService } from '../shared/blob';
import { createLogger } from '../shared/logger';
import { authenticate, requireRole } from '../shared/auth';
import { validateBody } from '../shared/validation';
import { sasRequestSchema } from '../schemas/sas.dto';
import {
  createSuccessResponse,
  getRequestId,
  handleOptionsRequest,
  withErrorHandling,
} from '../shared/http';

async function filesSas(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const requestId = getRequestId(request);
  const logger = createLogger({ requestId, operation: 'sas' });

  if (request.method === 'OPTIONS') {
    return handleOptionsRequest(requestId);
  }

  return withErrorHandling(async () => {
    const authContext = await authenticate(request, requestId);
    requireRole(authContext, 'files.sas', requestId);

    const body = validateBody(sasRequestSchema, request.body, requestId);

    const blobStorageService = new BlobStorageService(logger);

    logger.debug('Processing SAS token generation', {
      container: body.container,
      blobName: body.blobName,
      permissions: body.permissions,
      expiresInSeconds: body.expiresInSeconds,
    });

    const result = await blobStorageService.generateSasUrl(
      body.container,
      body.blobName,
      body.permissions,
      body.expiresInSeconds,
      requestId
    );

    logger.info('SAS token generation completed successfully', {
      container: body.container,
      blobName: body.blobName,
      permissions: body.permissions,
      expiresAt: result.expiresAt,
    });

    return createSuccessResponse(result, requestId, 200);
  }, requestId, logger);
}

app.http('files-sas', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'files/sas',
  handler: filesSas,
});