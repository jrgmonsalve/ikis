import { writeFileSync } from 'node:fs';

const required = [
  'API_BASE_URL',
  'AWS_REGION',
  'COGNITO_USER_POOL_ID',
  'COGNITO_APP_CLIENT_ID',
  'COGNITO_HOSTED_UI_URL'
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`${key} is required.`);
  }
}

const contents = `export const environment = {
  production: true,
  authMode: 'cognito',
  apiBaseUrl: '${process.env.API_BASE_URL}',
  awsRegion: '${process.env.AWS_REGION}',
  cognitoUserPoolId: '${process.env.COGNITO_USER_POOL_ID}',
  cognitoAppClientId: '${process.env.COGNITO_APP_CLIENT_ID}',
  cognitoHostedUiUrl: '${process.env.COGNITO_HOSTED_UI_URL}'
};
`;

writeFileSync('src/environments/environment.prod.ts', contents);
