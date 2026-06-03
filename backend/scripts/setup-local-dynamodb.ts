import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ResourceInUseException,
  waitUntilTableExists
} from '@aws-sdk/client-dynamodb';

const tableName = process.env.EXPENSES_TABLE_NAME ?? 'ikis-expense-control-local-expenses';
const endpoint = process.env.DYNAMODB_ENDPOINT ?? 'http://localhost:8001';
const region = process.env.AWS_REGION ?? 'us-east-1';

const client = new DynamoDBClient({
  endpoint,
  region,
  credentials: {
    accessKeyId: 'local',
    secretAccessKey: 'local'
  }
});

try {
  await client.send(new DescribeTableCommand({ TableName: tableName }));
  console.log(`DynamoDB Local table already exists: ${tableName}`);
} catch (error) {
  if (isMissingTableError(error)) {
    await createTable();
  } else {
    throw error;
  }
}

async function createTable(): Promise<void> {
  try {
    await client.send(
      new CreateTableCommand({
        TableName: tableName,
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: [
          { AttributeName: 'PK', AttributeType: 'S' },
          { AttributeName: 'SK', AttributeType: 'S' },
          { AttributeName: 'GSI1PK', AttributeType: 'S' },
          { AttributeName: 'GSI1SK', AttributeType: 'S' }
        ],
        KeySchema: [
          { AttributeName: 'PK', KeyType: 'HASH' },
          { AttributeName: 'SK', KeyType: 'RANGE' }
        ],
        GlobalSecondaryIndexes: [
          {
            IndexName: 'GSI1',
            KeySchema: [
              { AttributeName: 'GSI1PK', KeyType: 'HASH' },
              { AttributeName: 'GSI1SK', KeyType: 'RANGE' }
            ],
            Projection: {
              ProjectionType: 'ALL'
            }
          }
        ]
      })
    );
  } catch (error) {
    if (!(error instanceof ResourceInUseException)) {
      throw error;
    }
  }

  await waitUntilTableExists(
    {
      client,
      minDelay: 1,
      maxWaitTime: 20
    },
    {
      TableName: tableName
    }
  );

  console.log(`DynamoDB Local table is ready: ${tableName}`);
}

function isMissingTableError(error: unknown): boolean {
  return error instanceof Error && error.name === 'ResourceNotFoundException';
}
