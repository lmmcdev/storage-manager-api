import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { BlobStorageService } from '../shared/blob';
import { createLogger } from '../shared/logger';
import { authenticate, requireRole } from '../shared/auth';
import { validateBody } from '../shared/validation';
import { copyRequestSchema } from '../schemas/copy.dto';
import {
  createSuccessResponse,
  getRequestId,
  handleOptionsRequest,
  withErrorHandling,
} from '../shared/http';

async function filesCopy(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const requestId = getRequestId(request);
  const logger = createLogger({ requestId, operation: 'copy' });

  if (request.method === 'OPTIONS') {
    return handleOptionsRequest(requestId);
  }

  return withErrorHandling(async () => {
    const authContext = await authenticate(request, requestId);

    const body = validateBody(copyRequestSchema, request.body, requestId);

    if (body.move) {
      requireRole(authContext, 'files.delete', requestId);
    }
    requireRole(authContext, 'files.write', requestId);

    const blobStorageService = new BlobStorageService(logger);

    logger.debug(`Processing file ${body.move ? 'move' : 'copy'}`, {
      sourceContainer: body.source.container,
      sourceBlobName: body.source.blobName,
      targetContainer: body.target.container,
      targetBlobName: body.target.blobName,
      move: body.move,
    });

    const result = await blobStorageService.copyBlob({
      source: {
        container: body.source.container,
        blobName: body.source.blobName,
      },
      target: {
        container: body.target.container,
        blobName: body.target.blobName,
      },
      move: body.move,
      metadata: body.metadata,
    }, requestId);

    logger.info(`File ${body.move ? 'move' : 'copy'} completed successfully`, {
      sourceContainer: body.source.container,
      sourceBlobName: body.source.blobName,
      targetContainer: body.target.container,
      targetBlobName: body.target.blobName,
      move: body.move,
      size: result.size,
    });

    return createSuccessResponse(result, requestId, 200);
  }, requestId, logger);
}

app.http('files-copy', {
  methods: ['PUT', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'files/copy',
  handler: filesCopy,
});