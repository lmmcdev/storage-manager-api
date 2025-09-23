/**
 * Auth Login Controller
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';
import { UserService } from '../../../common/services/user.service';
import { JwtService } from '../../../common/services/jwt.service';
import { loginSchema } from '../../../common/dto/auth.dto';
import {
  getRequestId,
  handleOptionsRequest,
  createSuccessResponse,
  createErrorResponse,
  withErrorHandling,
} from '../../../common/utils/http.util';

export class AuthLoginController {
  private userService: UserService;
  private jwtService: JwtService;

  constructor() {
    this.userService = new UserService();
    this.jwtService = new JwtService();
  }

  async login(
    request: HttpRequest,
    _context: InvocationContext
  ): Promise<HttpResponseInit> {
    const requestId = getRequestId(request);

    if (request.method === 'OPTIONS') {
      return handleOptionsRequest(requestId);
    }

    return withErrorHandling(async () => {
      const body = await request.json();
      const validatedData = loginSchema.parse(body);

      const user = await this.userService.authenticateUser({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (!user) {
        return createErrorResponse(
          'Unauthorized',
          'Invalid email or password',
          requestId,
          401
        );
      }

      if (!user.isActive) {
        return createErrorResponse(
          'Forbidden',
          'Account is deactivated',
          requestId,
          403
        );
      }

      const tokens = this.jwtService.generateTokens(user);

      const result = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        tokens,
      };

      return createSuccessResponse(result, requestId, 200);
    }, requestId);
  }
}

// Register Azure Functions
const controller = new AuthLoginController();

app.http('auth-login', {
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'auth/login',
  handler: (request: HttpRequest, context: InvocationContext) =>
    controller.login(request, context),
});