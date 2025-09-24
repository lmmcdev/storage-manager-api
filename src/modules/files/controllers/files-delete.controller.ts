/**
 * Files Delete Controller
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { BlobStorageService } from '../../../common/services/blob-storage.service';
import { fileParamsSchema } from '../../../common/dto/common.dto';
import {
  createSuccessResponse,
  createErrorResponse,
  getRequestId,
  handleOptionsRequest,
  withErrorHandling,
} from '../../../common/utils/http.util';

export class FilesDeleteController {
  private blobStorageService: BlobStorageService;

  constructor() {
    this.blobStorageService = new BlobStorageService();
  }

  async delete(
    request: HttpRequest,
    _context: InvocationContext
  ): Promise<HttpResponseInit> {
    const requestId = getRequestId(request);

    if (request.method === 'OPTIONS') {
      return handleOptionsRequest(requestId);
    }

    return withErrorHandling(async () => {
      const validatedParams = fileParamsSchema.parse(request.params);

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

      await this.blobStorageService.deleteBlob(
        validatedParams.container,
        validatedParams.blobPath
      );

      const result = {
        message: 'File deleted successfully',
        container: validatedParams.container,
        blobPath: validatedParams.blobPath,
      };

      return createSuccessResponse(result, requestId, 200);
    }, requestId);
  }
}

// Register Azure Functions
const controller = new FilesDeleteController();

app.http('files-delete', {
  methods: ['DELETE', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'files/{container}/{*blobPath}',
  handler: (request: HttpRequest, context: InvocationContext) =>
    controller.delete(request, context),
});
