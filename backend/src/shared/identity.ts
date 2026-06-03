import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';

export function getUserId(event: APIGatewayProxyEventV2WithJWTAuthorizer): string {
  const claims = event.requestContext.authorizer.jwt.claims;
  const subject = claims.sub;

  if (!subject || typeof subject !== 'string') {
    throw new Error('JWT subject claim is required.');
  }

  return subject;
}
