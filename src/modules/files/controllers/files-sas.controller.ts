/**
 * Files SAS Controller
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { BlobStorageService } from '../../../common/services/blob-storage.service';
import { sasParamsSchema, sasQuerySchema } from '../../../common/dto/sas.dto';
import {
  createSuccessResponse,
  getRequestId,
  handleOptionsRequest,
  withErrorHandling,
} from '../../../common/utils/http.util';

export class FilesSasController {
  private blobStorageService: BlobStorageService;

  constructor() {
    this.blobStorageService = new BlobStorageService();
  }

  async generateSas(
    request: HttpRequest,
    _context: InvocationContext
  ): Promise<HttpResponseInit> {
    const requestId = getRequestId(request);

    if (request.method === 'OPTIONS') {
      return handleOptionsRequest(requestId);
    }

    return withErrorHandling(async () => {
      const validatedParams = sasParamsSchema.parse(request.params);
      const url = new URL(request.url);
      const queryParams = Object.fromEntries(url.searchParams.entries());
      const validatedQuery = sasQuerySchema.parse(queryParams);

      const sasResult = await this.blobStorageService.generateSasUrl(
        validatedParams.container,
        validatedParams.blobPath,
        validatedQuery.permissions,
        validatedQuery.expiresInSeconds
      );

      return createSuccessResponse(sasResult, requestId, 200);
    }, requestId);
  }
}

// Register Azure Functions
const controller = new FilesSasController();

app.http('files-sas', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'files/sas/{container}/{*blobPath}',
  handler: (request: HttpRequest, context: InvocationContext) =>
    controller.generateSas(request, context),
});
