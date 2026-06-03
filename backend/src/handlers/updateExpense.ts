import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { createExpenseService } from '../shared/dependencies.js';
import { getUserId } from '../shared/identity.js';
import { jsonResponse, parseJsonBody } from '../shared/http.js';
import type { ExpenseUpdateInput } from '../models/expense.js';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const userId = getUserId(event);
    const id = event.pathParameters?.id;

    if (!id) {
      return jsonResponse(400, { message: 'Expense id is required.' });
    }

    const input = parseJsonBody<ExpenseUpdateInput>(event.body);
    const expense = await createExpenseService().update(userId, id, input);
    return expense ? jsonResponse(200, expense) : jsonResponse(404, { message: 'Expense not found.' });
  } catch (error) {
    return jsonResponse(400, { message: error instanceof Error ? error.message : 'Invalid request.' });
  }
}
