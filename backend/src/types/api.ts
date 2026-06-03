import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

export type ApiResult = APIGatewayProxyStructuredResultV2;

export interface JwtClaims {
  sub?: string;
  username?: string;
  email?: string;
  [key: string]: unknown;
}
