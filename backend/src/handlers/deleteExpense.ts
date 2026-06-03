import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { createExpenseService } from '../shared/dependencies.js';
import { getUserId } from '../shared/identity.js';
import { emptyResponse, jsonResponse } from '../shared/http.js';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  const userId = getUserId(event);
  const id = event.pathParameters?.id;

  if (!id) {
    return jsonResponse(400, { message: 'Expense id is required.' });
  }

  const deleted = await createExpenseService().delete(userId, id);
  return deleted ? emptyResponse(204) : jsonResponse(404, { message: 'Expense not found.' });
}
