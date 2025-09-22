import { authenticate, requireRole, requireAnyRole } from '../auth';
import { UnauthorizedError, ForbiddenError } from '../errors';
import { HttpRequest } from '@azure/functions';

// Mock environment
process.env.AUTH_MODE = 'apikey';
process.env.API_KEYS = 'test-key-1,test-key-2';

describe('Authentication', () => {
  const mockRequestId = 'test-request-id';

  const createMockRequest = (headers: Record<string, string> = {}): HttpRequest => ({
    method: 'GET',
    url: 'https://example.com',
    headers: new Map(Object.entries(headers)),
    query: new URLSearchParams(),
    params: {},
    user: null,
    body: null,
  } as HttpRequest);

  describe('authenticate', () => {
    it('should authenticate with valid API key', async () => {
      const request = createMockRequest({ 'x-api-key': 'test-key-1' });
      const authContext = await authenticate(request, mockRequestId);

      expect(authContext.userId).toBe('api-user');
      expect(authContext.authMethod).toBe('apikey');
      expect(authContext.roles).toEqual(['files.read', 'files.write', 'files.delete', 'files.sas']);
    });

    it('should throw UnauthorizedError for missing API key', async () => {
      const request = createMockRequest();
      await expect(authenticate(request, mockRequestId)).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for invalid API key', async () => {
      const request = createMockRequest({ 'x-api-key': 'invalid-key' });
      await expect(authenticate(request, mockRequestId)).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('requireRole', () => {
    const authContext = {
      userId: 'test-user',
      roles: ['files.read', 'files.write'],
      authMethod: 'apikey' as const,
    };

    it('should pass for user with required role', () => {
      expect(() => requireRole(authContext, 'files.read', mockRequestId)).not.toThrow();
    });

    it('should throw ForbiddenError for user without required role', () => {
      expect(() => requireRole(authContext, 'files.delete', mockRequestId)).toThrow(ForbiddenError);
    });
  });

  describe('requireAnyRole', () => {
    const authContext = {
      userId: 'test-user',
      roles: ['files.read'],
      authMethod: 'apikey' as const,
    };

    it('should pass for user with at least one required role', () => {
      expect(() => requireAnyRole(authContext, ['files.read', 'files.write'], mockRequestId)).not.toThrow();
    });

    it('should throw ForbiddenError for user without any required role', () => {
      expect(() => requireAnyRole(authContext, ['files.write', 'files.delete'], mockRequestId)).toThrow(ForbiddenError);
    });
  });
});