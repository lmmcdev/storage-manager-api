/**
 * Files Copy Controller
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { BlobStorageService } from '../../../common/services/blob-storage.service';
import { copyBodySchema } from '../../../common/dto/copy.dto';
import {
  createSuccessResponse,
  getRequestId,
  handleOptionsRequest,
  withErrorHandling,
} from '../../../common/utils/http.util';

export class FilesCopyController {
  private blobStorageService: BlobStorageService;

  constructor() {
    this.blobStorageService = new BlobStorageService();
  }

  async copy(
    request: HttpRequest,
    _context: InvocationContext
  ): Promise<HttpResponseInit> {
    const requestId = getRequestId(request);

    if (request.method === 'OPTIONS') {
      return handleOptionsRequest(requestId);
    }

    return withErrorHandling(async () => {
      const bodyText = await request.text();
      const body = JSON.parse(bodyText);
      const validatedBody = copyBodySchema.parse(body);

      const copyResult = await this.blobStorageService.copyBlob({
        source: validatedBody.source,
        target: validatedBody.target,
        move: validatedBody.move,
        metadata: validatedBody.metadata,
      });

      return createSuccessResponse(copyResult, requestId, 200);
    }, requestId);
  }
}

// Register Azure Functions
const controller = new FilesCopyController();

app.http('files-copy', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'files/copy',
  handler: (request: HttpRequest, context: InvocationContext) =>
    controller.copy(request, context),
});
