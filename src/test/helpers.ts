import { HttpRequest } from '@azure/functions';

export function createMockRequest(
  headers: Record<string, string> = {},
  method: string = 'GET',
  url: string = 'http://localhost:7071/api/health'
): HttpRequest {
  const mockHeaders = new Headers();
  Object.entries(headers).forEach(([key, value]) => {
    mockHeaders.set(key, value);
  });

  return {
    method,
    url,
    headers: mockHeaders,
    query: new URLSearchParams(),
    params: {},
    user: null,
    body: null,
    bodyUsed: false,
    arrayBuffer: async () => new ArrayBuffer(0),
    blob: async () => new Blob([''], { type: 'text/plain' }),
    formData: async () => new FormData(),
    json: async () => ({}),
    text: async () => '',
    clone: () => createMockRequest(headers, method, url),
  } as HttpRequest;
}
