import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { BlobStorageService } from '../shared/blob';
import { createLogger } from '../shared/logger';
import { authenticate, requireRole } from '../shared/auth';
import { validateParams } from '../shared/validation';
import { fileParamsSchema } from '../schemas/common.dto';
import {
  createSuccessResponse,
  createErrorResponse,
  getRequestId,
  handleOptionsRequest,
  withErrorHandling,
} from '../shared/http';

async function filesDelete(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const requestId = getRequestId(request);
  const logger = createLogger({ requestId, operation: 'delete' });

  if (request.method === 'OPTIONS') {
    return handleOptionsRequest(requestId);
  }

  return withErrorHandling(async () => {
    const authContext = await authenticate(request, requestId);
    requireRole(authContext, 'files.delete', requestId);

    const params = validateParams(fileParamsSchema, request.params, requestId);

    const blobStorageService = new BlobStorageService(logger);

    logger.debug('Processing file deletion', {
      container: params.container,
      blobPath: params.blobPath,
    });

    await blobStorageService.deleteBlob(params.container, params.blobPath, requestId);

    const result = {
      deleted: true,
      container: params.container,
      blobName: params.blobPath,
    };

    logger.info('File deletion completed successfully', {
      container: params.container,
      blobPath: params.blobPath,
    });

    return createSuccessResponse(result, requestId, 200);
  }, requestId, logger);
}

app.http('files-delete', {
  methods: ['DELETE', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'files/{container}/{*blobPath}',
  handler: filesDelete,
});