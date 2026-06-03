import type { ApiResult } from '../types/api.js';

export function jsonResponse(statusCode: number, body: unknown): ApiResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  };
}

export function emptyResponse(statusCode: number): ApiResult {
  return {
    statusCode
  };
}

export function parseJsonBody<T>(body: string | undefined): T {
  if (!body) {
    throw new Error('Request body is required.');
  }

  return JSON.parse(body) as T;
}
