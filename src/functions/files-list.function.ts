import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { BlobStorageService } from '../shared/blob';
import { createLogger } from '../shared/logger';
import { authenticate, requireRole } from '../shared/auth';
import { validateQuery } from '../shared/validation';
import { listQuerySchema } from '../schemas/list.dto';
import {
  createSuccessResponse,
  getRequestId,
  handleOptionsRequest,
  withErrorHandling,
} from '../shared/http';
import { env } from '../shared/env';

async function filesList(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const requestId = getRequestId(request);
  const logger = createLogger({ requestId, operation: 'list' });

  if (request.method === 'OPTIONS') {
    return handleOptionsRequest(requestId);
  }

  return withErrorHandling(async () => {
    const authContext = await authenticate(request, requestId);
    requireRole(authContext, 'files.read', requestId);

    const query = validateQuery(listQuerySchema, new URL(request.url).searchParams, requestId);

    const container = query.container || env.AZURE_STORAGE_CONTAINER_DEFAULT;
    const blobStorageService = new BlobStorageService(logger);

    logger.debug('Processing files list', {
      container,
      prefix: query.prefix,
      max: query.max,
      hasContinuationToken: !!query.continuationToken,
    });

    const result = await blobStorageService.listBlobs(
      container,
      query.prefix,
      query.max,
      query.continuationToken,
      requestId
    );

    logger.info('Files list completed successfully', {
      container,
      itemCount: result.items.length,
      hasMore: !!result.continuationToken,
    });

    return createSuccessResponse(result, requestId, 200);
  }, requestId, logger);
}

app.http('files-list', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'files/list',
  handler: filesList,
});