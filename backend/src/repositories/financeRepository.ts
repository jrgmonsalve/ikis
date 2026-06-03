import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand
} from '@aws-sdk/lib-dynamodb';
import type { Account, Category, FinancialTransaction } from '../models/finance.js';
import { config } from '../shared/config.js';

type FinanceEntity = Account | Category | FinancialTransaction;
type EntityKind = 'ACCOUNT' | 'CATEGORY' | 'TRANSACTION';

interface FinanceItem extends Record<string, unknown> {
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  entityType: EntityKind;
}

export class FinanceRepository {
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

  async putAccount(account: Account): Promise<Account> {
    await this.put('ACCOUNT', account, accountSk(account.id));
    return account;
  }

  async getAccount(userId: string, id: string): Promise<Account | null> {
    return this.getById<Account>(userId, 'ACCOUNT', id);
  }

  async listAccounts(userId: string): Promise<Account[]> {
    return this.listByPrefix<Account>(userId, 'ACCOUNT#');
  }

  async deleteAccount(userId: string, id: string): Promise<void> {
    await this.delete(userId, accountSk(id));
  }

  async putCategory(category: Category): Promise<Category> {
    await this.put('CATEGORY', category, categorySk(category.id));
    return category;
  }

  async getCategory(userId: string, id: string): Promise<Category | null> {
    return this.getById<Category>(userId, 'CATEGORY', id);
  }

  async listCategories(userId: string): Promise<Category[]> {
    return this.listByPrefix<Category>(userId, 'CATEGORY#');
  }

  async deleteCategory(userId: string, id: string): Promise<void> {
    await this.delete(userId, categorySk(id));
  }

  async putTransaction(transaction: FinancialTransaction): Promise<FinancialTransaction> {
    await this.put('TRANSACTION', transaction, transactionSk(transaction.transactionDate, transaction.id));
    return transaction;
  }

  async listTransactions(userId: string): Promise<FinancialTransaction[]> {
    return this.listByPrefix<FinancialTransaction>(userId, 'TRANSACTION#', false);
  }

  async getTransaction(userId: string, id: string): Promise<FinancialTransaction | null> {
    return this.getById<FinancialTransaction>(userId, 'TRANSACTION', id);
  }

  async deleteTransaction(userId: string, transactionDate: string, id: string): Promise<void> {
    await this.delete(userId, transactionSk(transactionDate, id));
  }

  private async put(kind: EntityKind, entity: FinanceEntity, sortKey: string): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: toItem(kind, entity, sortKey)
      })
    );
  }

  private async getById<T extends FinanceEntity>(userId: string, kind: EntityKind, id: string): Promise<T | null> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :gsi1pk AND GSI1SK = :gsi1sk',
        ExpressionAttributeValues: {
          ':gsi1pk': entityIdPk(kind, id),
          ':gsi1sk': userPk(userId)
        }
      })
    );

    const item = result.Items?.[0] as FinanceItem | undefined;
    return item ? fromItem<T>(item) : null;
  }

  private async listByPrefix<T extends FinanceEntity>(
    userId: string,
    prefix: string,
    ascending = true
  ): Promise<T[]> {
    const result = await this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': userPk(userId),
          ':skPrefix': prefix
        },
        ScanIndexForward: ascending
      })
    );

    return (result.Items ?? []).map((item) => fromItem<T>(item as FinanceItem));
  }

  private async delete(userId: string, sortKey: string): Promise<void> {
    await this.client.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: {
          PK: userPk(userId),
          SK: sortKey
        }
      })
    );
  }
}

export function userPk(userId: string): string {
  return `USER#${userId}`;
}

function accountSk(id: string): string {
  return `ACCOUNT#${id}`;
}

function categorySk(id: string): string {
  return `CATEGORY#${id}`;
}

function transactionSk(transactionDate: string, id: string): string {
  return `TRANSACTION#${transactionDate}#${id}`;
}

function entityIdPk(kind: EntityKind, id: string): string {
  return `${kind}#${id}`;
}

function toItem(kind: EntityKind, entity: FinanceEntity, sortKey: string): FinanceItem {
  return {
    ...entity,
    PK: userPk(entity.userId),
    SK: sortKey,
    GSI1PK: entityIdPk(kind, entity.id),
    GSI1SK: userPk(entity.userId),
    entityType: kind
  };
}

function fromItem<T extends FinanceEntity>(item: FinanceItem): T {
  const entity: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(item)) {
    if (!['PK', 'SK', 'GSI1PK', 'GSI1SK', 'entityType'].includes(key)) {
      entity[key] = value;
    }
  }

  return entity as unknown as T;
}
