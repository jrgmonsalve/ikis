import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import { createExpenseService } from '../shared/dependencies.js';
import { getUserId } from '../shared/identity.js';
import { jsonResponse, parseJsonBody } from '../shared/http.js';
import type { ExpenseInput } from '../models/expense.js';

export async function handler(event: APIGatewayProxyEventV2WithJWTAuthorizer) {
  try {
    const userId = getUserId(event);
    const input = parseJsonBody<ExpenseInput>(event.body);
    const expense = await createExpenseService().create(userId, input);
    return jsonResponse(201, expense);
  } catch (error) {
    return jsonResponse(400, { message: error instanceof Error ? error.message : 'Invalid request.' });
  }
}
