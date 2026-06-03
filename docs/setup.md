# Setup Guide

## Recommended Architecture

The application is a serverless monorepo:

- Angular PWA assets are built into static files, uploaded to a private S3 bucket, and served through CloudFront using Origin Access Control.
- API Gateway HTTP API validates Cognito JWTs before forwarding requests to Lambda.
- Node.js 20 Lambda functions use a layered TypeScript backend and AWS SDK v3.
- DynamoDB stores expenses in a single table with `PK = USER#{userId}` and `SK = EXPENSE#{expenseDate}#{id}`. `GSI1` uses `GSI1PK = EXPENSE#{id}` and `GSI1SK = USER#{userId}` so reads by expense ID remain user-authorized without scanning a user's full history.
- Cognito provides the hosted login experience and federates Google OAuth.
- Terraform owns AWS infrastructure. GitHub Actions runs PR validation and main branch deployment.

## Manual Prerequisites

### AWS

- AWS account requirements:
  - Why: all application resources are deployed into your AWS account.
  - Where: AWS Console.
  - Values needed later: AWS account ID, AWS region, and the deployment role ARN.

- IAM user or OIDC role requirements:
  - Why: GitHub Actions needs permission to deploy Terraform-managed infrastructure.
  - Where: IAM in the AWS Console.
  - Values needed later: `AWS_ROLE_ARN` GitHub Secret.
  - Required permissions: S3, CloudFront, Cognito, API Gateway v2, Lambda, DynamoDB, IAM role/policy management, CloudWatch Logs, and STS assume-role permissions.

- Terraform backend requirements:
  - Why: local state is acceptable for solo experiments, but shared deployment needs durable state and locking.
  - Where: S3 and DynamoDB in AWS Console or a bootstrap Terraform stack.
  - Values needed later: state bucket name, state object key, backend region, and DynamoDB lock table name.

- Budget alarms configuration:
  - Why: Free Tier usage can still produce charges.
  - Where: AWS Budgets.
  - Values needed later: notification email, monthly budget threshold, and alert thresholds such as 50%, 80%, and 100%.

### GitHub

- Repository creation:
  - Why: GitHub Actions runs CI/CD from the repository.
  - Where: GitHub.
  - Values needed later: repository owner/name for OIDC trust policy conditions.

- Branch strategy:
  - Why: PR checks protect `main`, and `main` deploys automatically.
  - Where: GitHub branch protection rules.
  - Values needed later: protected branch name `main`.

- Required GitHub Secrets:
  - Why: CI/CD needs credentials and OAuth values without hardcoding them.
  - Where: Repository Settings > Secrets and variables > Actions.
  - Values needed later:
    - `AWS_ROLE_ARN`
    - `GOOGLE_CLIENT_ID`
    - `GOOGLE_CLIENT_SECRET`
    - `COGNITO_CALLBACK_URLS`, JSON list string such as `["http://localhost:4200","https://example.cloudfront.net"]`
    - `COGNITO_LOGOUT_URLS`, JSON list string such as `["http://localhost:4200","https://example.cloudfront.net"]`

- Required GitHub Actions permissions:
  - Why: OIDC deployment requires the workflow to request an identity token.
  - Where: Repository Settings > Actions > General, plus workflow `permissions`.
  - Values needed later: enable read access to contents and `id-token: write`.

### Google Cloud

- Create Google Cloud Project:
  - Why: Google OAuth credentials are created inside a Google Cloud project.
  - Where: Google Cloud Console.
  - Values needed later: project name and project ID for operations reference.

- Configure OAuth Consent Screen:
  - Why: Google requires consent screen configuration before issuing usable OAuth credentials.
  - Where: APIs & Services > OAuth consent screen.
  - Values needed later: app name, support email, developer contact email, and publishing status.

- Create OAuth Client ID:
  - Why: Cognito uses Google OAuth credentials as a federated identity provider.
  - Where: APIs & Services > Credentials.
  - Values needed later: `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.

- Configure Redirect URLs:
  - Why: Google only redirects to explicitly authorized Cognito callback endpoints.
  - Where: Google OAuth Client settings.
  - Exact value: `https://<cognito-domain>.auth.<aws-region>.amazoncognito.com/oauth2/idpresponse`.

- Configure Authorized Origins:
  - Why: Google validates the browser origin used for OAuth.
  - Where: Google OAuth Client settings.
  - Exact values: local frontend origin `http://localhost:4200` and the deployed CloudFront origin after Terraform outputs it.

## Terraform Structure

- `infra/versions.tf`: provider and Terraform version constraints.
- `infra/variables.tf`: deployment input values.
- `infra/main.tf`: S3, CloudFront, Cognito, API Gateway, Lambda, DynamoDB, and IAM resources.
- `infra/outputs.tf`: values consumed by deployment and frontend configuration.
- `infra/environments/dev/example.tfvars`: non-secret example values.

## Backend Structure

- `backend/src/handlers`: Lambda entrypoints for CRUD routes.
- `backend/src/services`: expense business logic and validation orchestration.
- `backend/src/repositories`: DynamoDB access using AWS SDK v3.
- `backend/src/models`: expense domain types.
- `backend/src/shared`: configuration, HTTP helpers, validation, and identity extraction.
- `backend/test`: focused unit tests for validation, identity, and repository key wiring.

## Frontend Structure

- `frontend/src/app`: standalone Angular app shell, routes, page placeholder, auth service, API service, and auth interceptor.
- `frontend/src/environments`: deployment placeholders for API, AWS region, Cognito IDs, and Hosted UI URL.
- `frontend/ngsw-config.json`: Angular service worker asset caching.
- `frontend/tailwind.config.js`: Tailwind content scanning.

## Deployment Flow

For local feature development, use [local-development.md](local-development.md) instead of the deployed AWS `dev` stack.

1. Create AWS, GitHub, and Google manual prerequisites.
2. Configure GitHub Secrets and repository variables.
3. Push to a feature branch and open a PR.
4. PR workflow installs dependencies, lints, tests, builds, validates Terraform, and runs a plan when AWS OIDC is available.
5. Merge to `main`.
6. Deploy workflow builds Lambda bundles, applies Terraform, builds the frontend, syncs S3 assets, and invalidates CloudFront.
7. The deploy workflow writes production frontend environment values from Terraform outputs before building the Angular app.

## Initial Implementation Roadmap

1. Complete OAuth callback handling in the Angular auth service.
2. Add expense list, create, edit, and delete screens.
3. Add request/response schemas and richer Lambda error handling.
4. Add frontend runtime configuration injection during deploy.
5. Add observability dashboards and alarms for API Gateway, Lambda, DynamoDB, and CloudFront.

## Cost Optimization Recommendations

- Use DynamoDB on-demand capacity for low and spiky early traffic.
- Keep Lambda memory at 128 MB until profiling shows a need to increase it.
- Use CloudFront caching for static assets and avoid unnecessary invalidations.
- Configure AWS Budgets before first deployment.
- Review CloudWatch Logs retention after launch and set explicit retention periods.

## Security Best Practices

- Use GitHub OIDC into AWS instead of long-lived AWS access keys.
- Keep the frontend S3 bucket private and only accessible through CloudFront OAC.
- Validate JWTs at API Gateway and re-derive `userId` from trusted claims inside Lambda.
- Use least-privilege IAM policies for Lambda and CI/CD.
- Keep Google OAuth credentials and Terraform variable values in GitHub Secrets.
- Enable DynamoDB encryption and point-in-time recovery.

## Future Scalability Recommendations

- Add GSIs only when new access patterns are known, such as reporting across users or category-level analytics.
- Add CloudWatch alarms for Lambda errors, throttles, duration, and API Gateway 4xx/5xx rates.
- Consider Cognito groups or custom claims if multi-user households or shared budgets become product requirements.
- Add an analytics/export workflow with S3 and EventBridge if expense history grows beyond interactive query needs.
