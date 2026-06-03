import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { createExpenseService } from '../shared/dependencies.js';
import { getUserId } from '../shared/identity.js';
import { jsonResponse } from '../shared/http.js';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  const userId = getUserId(event);
  const id = event.pathParameters?.id;

  if (!id) {
    return jsonResponse(400, { message: 'Expense id is required.' });
  }

  const expense = await createExpenseService().get(userId, id);
  return expense ? jsonResponse(200, expense) : jsonResponse(404, { message: 'Expense not found.' });
}
