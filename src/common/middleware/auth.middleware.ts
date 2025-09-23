import { HttpRequest, HttpResponseInit } from '@azure/functions';
import { JwtService } from '../services/jwt.service';
import { ApiKeyService } from '../services/api-key.service';
import { UserService } from '../services/user.service';
import { AzureAuthService } from '../services/azure-auth.service';
import {
  AuthContext,
  Permission,
  UserRole,
} from '../interfaces/auth.interface';
import {
  createErrorResponse,
  getRequestId,
} from '../utils/http.util';
import { env } from '../config/env';

export interface AuthOptions {
  required?: boolean;
  permissions?: Permission[];
  roles?: UserRole[];
  allowApiKey?: boolean;
  allowJwt?: boolean;
}

export class AuthMiddleware {
  private jwtService: JwtService;
  private apiKeyService: ApiKeyService;
  private userService: UserService;
  private azureAuthService: AzureAuthService;

  constructor() {
    this.jwtService = new JwtService();
    this.apiKeyService = new ApiKeyService();
    this.userService = new UserService();
    this.azureAuthService = new AzureAuthService({
      tenantId: env.AZURE_TENANT_ID,
      clientId: env.AZURE_CLIENT_ID,
      clientSecret: env.AZURE_CLIENT_SECRET,
    });
  }

  async authenticate(
    request: HttpRequest,
    options: AuthOptions = {}
  ): Promise<{ context: AuthContext; response?: HttpResponseInit }> {
    const requestId = getRequestId(request);

    const {
      required = true,
      permissions = [],
      roles = [],
      allowApiKey = true,
      allowJwt = true,
    } = options;

    let authContext: AuthContext = {
      permissions: [],
      isAuthenticated: false,
    };

    const authHeader = request.headers.get('authorization');
    const apiKeyHeader = request.headers.get('x-api-key');

    // Try Azure AAD authentication first if enabled
    if (env.AUTH_MODE === 'aad' && authHeader) {
      const aadResult = await this.authenticateAzureAAD(authHeader, requestId);
      if (aadResult.response) {
        return { context: authContext, response: aadResult.response };
      }
      if (aadResult.context) {
        authContext = aadResult.context;
      }
    } else if (allowJwt && authHeader) {
      const jwtResult = await this.authenticateJwt(authHeader, requestId);
      if (jwtResult.response) {
        return { context: authContext, response: jwtResult.response };
      }
      if (jwtResult.context) {
        authContext = jwtResult.context;
      }
    } else if (allowApiKey && apiKeyHeader) {
      const apiKeyResult = await this.authenticateApiKey(apiKeyHeader, requestId);
      if (apiKeyResult.response) {
        return { context: authContext, response: apiKeyResult.response };
      }
      if (apiKeyResult.context) {
        authContext = apiKeyResult.context;
      }
    }

    if (required && !authContext.isAuthenticated) {
      return {
        context: authContext,
        response: createErrorResponse(
          'Unauthorized',
          'Authentication required',
          requestId,
          401
        ),
      };
    }

    if (permissions.length > 0 && !this.hasRequiredPermissions(authContext, permissions)) {
      return {
        context: authContext,
        response: createErrorResponse(
          'Forbidden',
          'Insufficient permissions',
          requestId,
          403
        ),
      };
    }

    if (roles.length > 0 && !this.hasRequiredRole(authContext, roles)) {
      return {
        context: authContext,
        response: createErrorResponse(
          'Forbidden',
          'Insufficient role privileges',
          requestId,
          403
        ),
      };
    }

    return { context: authContext };
  }

  private async authenticateAzureAAD(
    authHeader: string,
    requestId: string
  ): Promise<{ context?: AuthContext; response?: HttpResponseInit }> {
    const token = this.azureAuthService.extractTokenFromHeader(authHeader);
    if (!token) {
      return {
        response: createErrorResponse(
          'Unauthorized',
          'Invalid authorization header format',
          requestId,
          401
        ),
      };
    }

    const authContext = await this.azureAuthService.createAuthContext(token);
    if (!authContext) {
      return {
        response: createErrorResponse(
          'Unauthorized',
          'Invalid Azure AD token',
          requestId,
          401
        ),
      };
    }

    return { context: authContext };
  }

  private async authenticateJwt(
    authHeader: string,
    requestId: string
  ): Promise<{ context?: AuthContext; response?: HttpResponseInit }> {
    const token = this.jwtService.extractTokenFromHeader(authHeader);
    if (!token) {
      return {
        response: createErrorResponse(
          'Unauthorized',
          'Invalid authorization header format',
          requestId,
          401
        ),
      };
    }

    const payload = this.jwtService.verifyAccessToken(token);
    if (!payload) {
      return {
        response: createErrorResponse(
          'Unauthorized',
          'Invalid or expired token',
          requestId,
          401
        ),
      };
    }

    const user = await this.userService.getUserById(payload.sub);
    if (!user || !user.isActive) {
      return {
        response: createErrorResponse(
          'Unauthorized',
          'User not found or inactive',
          requestId,
          401
        ),
      };
    }

    const userPermissions = this.getUserPermissions(user.role);

    return {
      context: {
        user,
        permissions: userPermissions,
        isAuthenticated: true,
      },
    };
  }

  private async authenticateApiKey(
    apiKeyValue: string,
    requestId: string
  ): Promise<{ context?: AuthContext; response?: HttpResponseInit }> {
    const apiKey = await this.apiKeyService.validateApiKey(apiKeyValue);
    if (!apiKey) {
      return {
        response: createErrorResponse(
          'Unauthorized',
          'Invalid API key',
          requestId,
          401
        ),
      };
    }

    return {
      context: {
        apiKey,
        permissions: apiKey.permissions,
        isAuthenticated: true,
      },
    };
  }

  private hasRequiredPermissions(
    context: AuthContext,
    requiredPermissions: Permission[]
  ): boolean {
    if (!context.isAuthenticated) {
      return false;
    }

    return requiredPermissions.every(permission =>
      context.permissions.includes(permission)
    );
  }

  private hasRequiredRole(
    context: AuthContext,
    requiredRoles: UserRole[]
  ): boolean {
    if (!context.user) {
      return false;
    }

    return requiredRoles.includes(context.user.role);
  }

  private getUserPermissions(role: UserRole): Permission[] {
    switch (role) {
      case UserRole.ADMIN:
        return Object.values(Permission);
      case UserRole.USER:
        return [
          Permission.FILES_READ,
          Permission.FILES_WRITE,
          Permission.FILES_LIST,
          Permission.FILES_COPY,
          Permission.FILES_SAS,
        ];
      case UserRole.READONLY:
        return [Permission.FILES_READ, Permission.FILES_LIST];
      default:
        return [];
    }
  }

  extractEndpointPermissions(request: HttpRequest): Permission[] {
    const url = new URL(request.url);
    const pathname = url.pathname.replace('/api', '');
    const method = request.method;

    return this.apiKeyService.getPermissionsForEndpoint(pathname, method);
  }
}

export const authMiddleware = new AuthMiddleware();