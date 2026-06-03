import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand
} from '@aws-sdk/lib-dynamodb';
import type { Expense } from '../models/expense.js';
import { config } from '../shared/config.js';

export class ExpenseRepository {
  private readonly client: DynamoDBDocumentClient;

  constructor(
    private readonly tableName: string,
    client = DynamoDBDocumentClient.from(
      new DynamoDBClient({
        endpoint: config.dynamodbEndpoint,
        region: config.awsRegion,
        credentials: config.dynamodbEndpoint
          ? {
              accessKeyId: 'local',
              secretAccessKey: 'local'
            }
          : undefined
      })
    )
  ) {
    this.client = client;
  }

  async create(expense: Expense): Promise<Expense> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: toItem(expense),
        ConditionExpression: 'attribute_not_exists(PK)'
      })
    );

    return expense;
  }

  async get(userId: string, id: string): Promise<Expense | null> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :gsi1pk AND GSI1SK = :gsi1sk',
        ExpressionAttributeValues: {
          ':gsi1pk': expenseIdPk(id),
          ':gsi1sk': userPk(userId)
        }
      })
    );

    const item = result.Items?.[0];
    return item ? fromItem(item as ExpenseItem) : null;
  }

  async listByUser(userId: string): Promise<Expense[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': userPk(userId),
          ':skPrefix': 'EXPENSE#'
        },
        ScanIndexForward: false
      })
    );

    return (result.Items ?? []).map((item) => fromItem(item as ExpenseItem));
  }

  async update(expense: Expense, previousExpenseDate?: string): Promise<Expense> {
    if (previousExpenseDate && previousExpenseDate !== expense.expenseDate) {
      await this.delete(expense.userId, previousExpenseDate, expense.id);
      return this.create(expense);
    }

    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: toItem(expense),
        ConditionExpression: 'attribute_exists(PK)'
      })
    );

    return expense;
  }

  async delete(userId: string, expenseDate: string, id: string): Promise<void> {
    await this.client.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: {
          PK: userPk(userId),
          SK: expenseSk(expenseDate, id)
        }
      })
    );
  }
}

interface ExpenseItem extends Expense {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
}

export function userPk(userId: string): string {
  return `USER#${userId}`;
}

export function expenseSk(expenseDate: string, id: string): string {
  return `EXPENSE#${expenseDate}#${id}`;
}

export function expenseIdPk(id: string): string {
  return `EXPENSE#${id}`;
}

function toItem(expense: Expense): ExpenseItem {
  return {
    ...expense,
    PK: userPk(expense.userId),
    SK: expenseSk(expense.expenseDate, expense.id),
    GSI1PK: expenseIdPk(expense.id),
    GSI1SK: userPk(expense.userId)
  };
}

function fromItem(item: ExpenseItem): Expense {
  return {
    id: item.id,
    userId: item.userId,
    amount: item.amount,
    category: item.category,
    description: item.description,
    expenseDate: item.expenseDate,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}
