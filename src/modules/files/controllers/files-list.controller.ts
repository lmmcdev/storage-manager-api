/**
 * Files List Controller
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { BlobStorageService } from '../../../common/services/blob-storage.service';
import { listQuerySchema } from '../../../common/dto/list.dto';
import {
  createSuccessResponse,
  getRequestId,
  handleOptionsRequest,
  withErrorHandling,
} from '../../../common/utils/http.util';
import { env } from '../../../common/config/env';

export class FilesListController {
  private blobStorageService: BlobStorageService;

  constructor() {
    this.blobStorageService = new BlobStorageService();
  }

  async list(
    request: HttpRequest,
    _context: InvocationContext
  ): Promise<HttpResponseInit> {
    const requestId = getRequestId(request);

    if (request.method === 'OPTIONS') {
      return handleOptionsRequest(requestId);
    }

    return withErrorHandling(async () => {
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams.entries());
      const validatedQuery = listQuerySchema.parse(queryParams);

      const container =
        validatedQuery.container || env.AZURE_STORAGE_CONTAINER_DEFAULT;

      const result = await this.blobStorageService.listBlobs(
        container,
        validatedQuery.prefix,
        validatedQuery.max,
        validatedQuery.continuationToken
      );

      return createSuccessResponse(result, requestId, 200);
    }, requestId);
  }
}

// Register Azure Functions
const controller = new FilesListController();

app.http('files-list', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'files/list',
  handler: (request: HttpRequest, context: InvocationContext) =>
    controller.list(request, context),
});
