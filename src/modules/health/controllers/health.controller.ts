/**
 * Health Controller
 */

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';

export class HealthController {
  async healthCheck(
    request: HttpRequest,
    _context: InvocationContext
  ): Promise<HttpResponseInit> {
    if (request.method === 'OPTIONS') {
      return {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      };
    }

    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
    };

    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      jsonBody: {
        data: healthStatus,
        requestId: 'health-check',
      },
    };
  }
}

// Register Azure Functions
const controller = new HealthController();

app.http('health', {
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  route: 'health',
  handler: (request: HttpRequest, context: InvocationContext) =>
    controller.healthCheck(request, context),
});
