export const config = {
  get expensesTableName(): string {
    return process.env.EXPENSES_TABLE_NAME ?? '';
  },
  get dynamodbEndpoint(): string | undefined {
    return process.env.DYNAMODB_ENDPOINT;
  },
  get awsRegion(): string {
    return process.env.AWS_REGION ?? 'us-east-1';
  }
};
