export const environment = {
  production: false,
  authMode: 'cognito',
  apiBaseUrl: 'https://replace-with-api-id.execute-api.us-east-1.amazonaws.com',
  awsRegion: 'us-east-1',
  cognitoUserPoolId: 'us-east-1_REPLACE',
  cognitoAppClientId: 'replace-with-client-id',
  cognitoHostedUiUrl:
    'https://replace-with-domain.auth.us-east-1.amazoncognito.com/login?client_id=replace-with-client-id&response_type=code&scope=openid%20email%20profile&redirect_uri=http://localhost:4200'
};
