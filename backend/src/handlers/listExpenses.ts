import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { createExpenseService } from '../shared/dependencies.js';
import { getUserId } from '../shared/identity.js';
import { jsonResponse } from '../shared/http.js';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  const userId = getUserId(event);
  const expenses = await createExpenseService().list(userId);
  return jsonResponse(200, expenses);
}
