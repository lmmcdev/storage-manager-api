import { HttpRequest } from '@azure/functions';
import jwt from 'jsonwebtoken';
import { env, getApiKeys, getAllowedRoles } from './env';
import { UnauthorizedError, ForbiddenError } from './errors';

export interface AuthContext {
  userId?: string;
  roles: string[];
  authMethod: 'aad' | 'apikey';
}

export interface JwtPayload {
  sub?: string;
  oid?: string;
  roles?: string[];
  scp?: string;
  [key: string]: unknown;
}

export async function authenticate(request: HttpRequest, requestId: string): Promise<AuthContext> {
  if (env.AUTH_MODE === 'apikey') {
    return authenticateWithApiKey(request, requestId);
  } else {
    return authenticateWithAAD(request, requestId);
  }
}

function authenticateWithApiKey(request: HttpRequest, requestId: string): AuthContext {
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    throw new UnauthorizedError('API key is required', requestId);
  }

  const validKeys = getApiKeys();
  if (!validKeys.includes(apiKey)) {
    throw new UnauthorizedError('Invalid API key', requestId);
  }

  return {
    userId: 'api-user',
    roles: getAllowedRoles(),
    authMethod: 'apikey',
  };
}

async function authenticateWithAAD(request: HttpRequest, requestId: string): Promise<AuthContext> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Bearer token is required', requestId);
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.decode(token) as JwtPayload;

    if (!decoded) {
      throw new UnauthorizedError('Invalid token format', requestId);
    }

    const userId = decoded.sub || decoded.oid;
    if (!userId) {
      throw new UnauthorizedError('Token missing user identifier', requestId);
    }

    let roles: string[] = [];
    if (decoded.roles) {
      roles = decoded.roles;
    } else if (decoded.scp) {
      roles = decoded.scp.split(' ');
    }

    return {
      userId,
      roles,
      authMethod: 'aad',
    };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new UnauthorizedError('Invalid token', requestId);
    }
    throw error;
  }
}

export function requireRole(authContext: AuthContext, requiredRole: string, requestId: string): void {
  if (!authContext.roles.includes(requiredRole)) {
    throw new ForbiddenError(
      `Required role '${requiredRole}' not found`,
      requestId,
      {
        requiredRole,
        userRoles: authContext.roles,
      }
    );
  }
}

export function requireAnyRole(authContext: AuthContext, requiredRoles: string[], requestId: string): void {
  const hasRole = requiredRoles.some(role => authContext.roles.includes(role));

  if (!hasRole) {
    throw new ForbiddenError(
      `One of the following roles is required: ${requiredRoles.join(', ')}`,
      requestId,
      {
        requiredRoles,
        userRoles: authContext.roles,
      }
    );
  }
}

export function extractUserFromRequest(request: HttpRequest): string | undefined {
  if (env.AUTH_MODE === 'apikey') {
    return 'api-user';
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return undefined;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.decode(token) as JwtPayload;
    return decoded?.sub || decoded?.oid;
  } catch {
    return undefined;
  }
}