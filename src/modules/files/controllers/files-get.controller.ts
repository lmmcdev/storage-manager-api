/**
 * Files Get Controller
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { BlobStorageService } from '../../../common/services/blob-storage.service';
import {
  fileParamsSchema,
  downloadQuerySchema,
} from '../../../common/dto/common.dto';
import {
  getRequestId,
  handleOptionsRequest,
  createStreamResponse,
  parseRangeHeader,
  withErrorHandling,
  createErrorResponse,
} from '../../../common/utils/http.util';
import * as path from 'path';

export class FilesGetController {
  private blobStorageService: BlobStorageService;

  constructor() {
    this.blobStorageService = new BlobStorageService();
  }

  async get(
    request: HttpRequest,
    _context: InvocationContext
  ): Promise<HttpResponseInit> {
    const requestId = getRequestId(request);

    if (request.method === 'OPTIONS') {
      return handleOptionsRequest(requestId);
    }

    return withErrorHandling(async () => {
      const validatedParams = fileParamsSchema.parse(request.params);
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams.entries());
      const validatedQuery = downloadQuerySchema.parse(queryParams);

      let range: { start: number; end: number } | undefined;
      const rangeHeader = request.headers.get('range');

      if (rangeHeader) {
        // For range requests, we need to get the file size first
        const blobExists = await this.blobStorageService.blobExists(
          validatedParams.container,
          validatedParams.blobPath
        );

        if (!blobExists) {
          return createErrorResponse(
            'Not Found',
            'File not found',
            requestId,
            404
          );
        }

        // Note: In a real implementation, you'd want to get the content length
        // For simplicity, we'll parse the range without validation
        const parsedRange = parseRangeHeader(
          rangeHeader,
          Number.MAX_SAFE_INTEGER
        );
        if (!parsedRange) {
          return createErrorResponse(
            'Bad Request',
            'Invalid Range header',
            requestId,
            400
          );
        }
        range = parsedRange;
      }

      const downloadResponse = await this.blobStorageService.downloadBlob(
        validatedParams.container,
        validatedParams.blobPath,
        range
      );

      if (!downloadResponse.readableStreamBody) {
        return createErrorResponse(
          'Internal Server Error',
          'No readable stream in download response',
          requestId,
          500
        );
      }

      const fileName = path.basename(validatedParams.blobPath);
      const contentType =
        downloadResponse.contentType || 'application/octet-stream';
      const contentLength = downloadResponse.contentLength;

      return createStreamResponse(
        downloadResponse.readableStreamBody as any,
        requestId,
        contentType,
        contentLength,
        fileName,
        validatedQuery.download
      );
    }, requestId);
  }
}

// Register Azure Functions
const controller = new FilesGetController();

app.http('files-get', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'files/download/{container}/{*blobPath}',
  handler: (request: HttpRequest, context: InvocationContext) =>
    controller.get(request, context),
});
