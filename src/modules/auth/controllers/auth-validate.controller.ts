/**
 * Auth Validation Controller
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { authMiddleware } from '../../../common/middleware/auth.middleware';
import { Permission } from '../../../common/interfaces/auth.interface';
import {
  getRequestId,
  handleOptionsRequest,
  createSuccessResponse,
} from '../../../common/utils/http.util';

export class AuthValidateController {
  async validate(
    request: HttpRequest,
    _context: InvocationContext
  ): Promise<HttpResponseInit> {
    const requestId = getRequestId(request);

    if (request.method === 'OPTIONS') {
      return handleOptionsRequest(requestId);
    }

    const authResult = await authMiddleware.authenticate(request, {
      required: true,
      permissions: [], // No specific permissions required for validation
    });

    if (authResult.response) {
      return authResult.response;
    }

    const { user, apiKey, permissions, isAuthenticated } = authResult.context;

    const result = {
      isAuthenticated,
      authType: user ? 'aad' : apiKey ? 'apikey' : 'unknown',
      user: user ? {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      } : undefined,
      apiKey: apiKey ? {
        id: apiKey.id,
        name: apiKey.name,
        userId: apiKey.userId,
      } : undefined,
      permissions,
      timestamp: new Date().toISOString(),
    };

    return createSuccessResponse(result, requestId, 200);
  }
}

// Register Azure Functions
const controller = new AuthValidateController();

app.http('auth-validate', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'auth/validate',
  handler: (request: HttpRequest, context: InvocationContext) =>
    controller.validate(request, context),
});