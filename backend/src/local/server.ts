import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type {
  AccountInput,
  AccountUpdateInput,
  CategoryInput,
  CategoryUpdateInput,
  TransactionInput
} from '../models/finance.js';
import { ExpenseRepository } from '../repositories/expenseRepository.js';
import { FinanceRepository } from '../repositories/financeRepository.js';
import { ExpenseService } from '../services/expenseService.js';
import { FinanceService } from '../services/financeService.js';
import { config } from '../shared/config.js';
import type { ExpenseInput, ExpenseUpdateInput } from '../models/expense.js';

const port = Number(process.env.PORT ?? 3000);
const tableName = process.env.EXPENSES_TABLE_NAME ?? 'ikis-expense-control-local-expenses';
const localUserId = process.env.LOCAL_USER_ID ?? 'local-dev-user';

process.env.EXPENSES_TABLE_NAME = tableName;
process.env.DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT ?? 'http://localhost:8001';
process.env.AWS_REGION = process.env.AWS_REGION ?? config.awsRegion;

const service = new ExpenseService(new ExpenseRepository(tableName));
const financeService = new FinanceService(new FinanceRepository(tableName));

const server = createServer(async (request, response) => {
  setCorsHeaders(response);

  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  try {
    await routeRequest(request, response);
  } catch (error) {
    sendJson(response, 400, {
      message: error instanceof Error ? error.message : 'Invalid request.'
    });
  }
});

server.listen(port, () => {
  console.log(`Local API listening on http://localhost:${port}`);
  console.log(`DynamoDB endpoint: ${process.env.DYNAMODB_ENDPOINT}`);
  console.log(`Expenses table: ${tableName}`);
  console.log(`Mock user: ${localUserId}`);
});

async function routeRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? `localhost:${port}`}`);
  const id = matchExpenseId(url.pathname);
  const accountId = matchEntityId(url.pathname, 'accounts');
  const categoryId = matchEntityId(url.pathname, 'categories');

  if (request.method === 'GET' && url.pathname === '/health') {
    sendJson(response, 200, { status: 'ok' });
    return;
  }

  if (request.method === 'GET' && url.pathname === '/accounts') {
    sendJson(response, 200, await financeService.listAccounts(getLocalUserId(request)));
    return;
  }

  if (request.method === 'POST' && url.pathname === '/accounts') {
    const body = await readJsonBody<AccountInput>(request);
    sendJson(response, 201, await financeService.createAccount(getLocalUserId(request), body));
    return;
  }

  if (request.method === 'PUT' && accountId) {
    const body = await readJsonBody<AccountUpdateInput>(request);
    const account = await financeService.updateAccount(getLocalUserId(request), accountId, body);
    if (account) {
      sendJson(response, 200, account);
    } else {
      sendJson(response, 404, { message: 'Account not found.' });
    }
    return;
  }

  if (request.method === 'DELETE' && accountId) {
    const deleted = await financeService.deleteAccount(getLocalUserId(request), accountId);
    sendNoContentOrNotFound(response, deleted, 'Account not found.');
    return;
  }

  if (request.method === 'GET' && url.pathname === '/categories') {
    sendJson(response, 200, await financeService.listCategories(getLocalUserId(request)));
    return;
  }

  if (request.method === 'POST' && url.pathname === '/categories') {
    const body = await readJsonBody<CategoryInput>(request);
    sendJson(response, 201, await financeService.createCategory(getLocalUserId(request), body));
    return;
  }

  if (request.method === 'PUT' && categoryId) {
    const body = await readJsonBody<CategoryUpdateInput>(request);
    const category = await financeService.updateCategory(getLocalUserId(request), categoryId, body);
    if (category) {
      sendJson(response, 200, category);
    } else {
      sendJson(response, 404, { message: 'Category not found.' });
    }
    return;
  }

  if (request.method === 'DELETE' && categoryId) {
    const deleted = await financeService.deleteCategory(getLocalUserId(request), categoryId);
    sendNoContentOrNotFound(response, deleted, 'Category not found.');
    return;
  }

  if (request.method === 'GET' && url.pathname === '/transactions') {
    sendJson(response, 200, await financeService.listTransactions(getLocalUserId(request)));
    return;
  }

  if (request.method === 'POST' && url.pathname === '/transactions') {
    const body = await readJsonBody<TransactionInput>(request);
    sendJson(response, 201, await financeService.createTransaction(getLocalUserId(request), body));
    return;
  }

  if (request.method === 'GET' && url.pathname === '/expenses') {
    sendJson(response, 200, await service.list(getLocalUserId(request)));
    return;
  }

  if (request.method === 'POST' && url.pathname === '/expenses') {
    const body = await readJsonBody<ExpenseInput>(request);
    sendJson(response, 201, await service.create(getLocalUserId(request), body));
    return;
  }

  if (request.method === 'GET' && id) {
    const expense = await service.get(getLocalUserId(request), id);
    if (expense) {
      sendJson(response, 200, expense);
    } else {
      sendJson(response, 404, { message: 'Expense not found.' });
    }
    return;
  }

  if (request.method === 'PUT' && id) {
    const body = await readJsonBody<ExpenseUpdateInput>(request);
    const expense = await service.update(getLocalUserId(request), id, body);
    if (expense) {
      sendJson(response, 200, expense);
    } else {
      sendJson(response, 404, { message: 'Expense not found.' });
    }
    return;
  }

  if (request.method === 'DELETE' && id) {
    const deleted = await service.delete(getLocalUserId(request), id);
    if (deleted) {
      response.writeHead(204);
      response.end();
      return;
    }

    sendJson(response, 404, { message: 'Expense not found.' });
    return;
  }

  sendJson(response, 404, { message: 'Route not found.' });
}

function matchExpenseId(pathname: string): string | null {
  const match = pathname.match(/^\/expenses\/([^/]+)$/);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function matchEntityId(pathname: string, entityPath: 'accounts' | 'categories'): string | null {
  const match = pathname.match(new RegExp(`^/${entityPath}/([^/]+)$`));
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function getLocalUserId(request: IncomingMessage): string {
  const headerValue = request.headers['x-local-user-id'];
  return typeof headerValue === 'string' && headerValue.trim() ? headerValue.trim() : localUserId;
}

async function readJsonBody<T>(request: IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  if (!rawBody) {
    throw new Error('Request body is required.');
  }

  return JSON.parse(rawBody) as T;
}

function sendJson(response: ServerResponse, statusCode: number, body: unknown): void {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json'
  });
  response.end(JSON.stringify(body));
}

function sendNoContentOrNotFound(response: ServerResponse, deleted: boolean, message: string): void {
  if (deleted) {
    response.writeHead(204);
    response.end();
    return;
  }

  sendJson(response, 404, { message });
}

function setCorsHeaders(response: ServerResponse): void {
  response.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
  response.setHeader('Access-Control-Allow-Methods', 'DELETE,GET,OPTIONS,POST,PUT');
  response.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type,X-Local-User-Id');
}
