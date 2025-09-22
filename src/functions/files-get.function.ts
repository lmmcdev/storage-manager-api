import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { BlobStorageService } from '../shared/blob';
import { createLogger } from '../shared/logger';
import { authenticate, requireRole } from '../shared/auth';
import { validateParams, validateQuery } from '../shared/validation';
import { fileParamsSchema, downloadQuerySchema } from '../schemas/common.dto';
import {
  getRequestId,
  handleOptionsRequest,
  createStreamResponse,
  parseRangeHeader,
  withErrorHandling,
} from '../shared/http';
import { BadRequestError } from '../shared/errors';
import path from 'path';

async function filesGet(request: HttpRequest, _context: InvocationContext): Promise<HttpResponseInit> {
  const requestId = getRequestId(request);
  const logger = createLogger({ requestId, operation: 'download' });

  if (request.method === 'OPTIONS') {
    return handleOptionsRequest(requestId);
  }

  return withErrorHandling(async () => {
    const authContext = await authenticate(request, requestId);
    requireRole(authContext, 'files.read', requestId);

    const params = validateParams(fileParamsSchema, request.params, requestId);
    const query = validateQuery(downloadQuerySchema, new URL(request.url).searchParams, requestId);

    const blobStorageService = new BlobStorageService(logger);

    logger.debug('Processing file download', {
      container: params.container,
      blobPath: params.blobPath,
      forceDownload: query.download,
    });

    const rangeHeader = request.headers.get('range');
    let range: { start: number; end: number } | undefined;

    if (rangeHeader) {
      const blobClient = (blobStorageService as any).getBlobClient(params.container, params.blobPath);
      const properties = await blobClient.getProperties();
      const contentLength = properties.contentLength || 0;

      const parsedRange = parseRangeHeader(rangeHeader, contentLength);
      if (!parsedRange) {
        throw new BadRequestError('Invalid Range header', requestId);
      }
      range = parsedRange;

      logger.debug('Processing range request', {
        range: `${range.start}-${range.end}`,
        totalSize: contentLength,
      });
    }

    const downloadResponse = await blobStorageService.downloadBlob(
      params.container,
      params.blobPath,
      range,
      requestId
    );

    if (!downloadResponse.readableStreamBody) {
      throw new Error('No readable stream in download response');
    }

    const fileName = path.basename(params.blobPath);
    const contentType = downloadResponse.contentType || 'application/octet-stream';
    const contentLength = downloadResponse.contentLength;

    logger.info('File download completed successfully', {
      container: params.container,
      blobPath: params.blobPath,
      contentType,
      contentLength,
      hasRange: !!range,
    });

    return createStreamResponse(
      downloadResponse.readableStreamBody,
      requestId,
      contentType,
      contentLength,
      fileName,
      query.download
    );
  }, requestId, logger);
}

app.http('files-get', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'files/{container}/{*blobPath}',
  handler: filesGet,
});