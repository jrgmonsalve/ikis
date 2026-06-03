# Personal Expense Tracker PWA

Production-oriented starter monorepo for a personal expense tracker PWA on AWS.

## Architecture

- Frontend: Angular 21 standalone PWA, Tailwind CSS, hosted on S3 and CloudFront.
- Backend: Node.js 20 TypeScript Lambda functions behind API Gateway HTTP API.
- Authentication: Amazon Cognito User Pool with Google OAuth federation and JWT validation at API Gateway.
- Database: DynamoDB single-table expense storage optimized for user-scoped, date-ordered queries.
- Infrastructure: Terraform.
- CI/CD: GitHub Actions for PR checks and main branch deployments.

## Repository Structure

```text
.
├── frontend/
├── backend/
├── infra/
├── docs/
├── .github/workflows/
├── README.md
└── .gitignore
```

## Local Development

For day-to-day feature work, use the local stack so the app does not depend on the shared AWS `dev` environment.

```bash
docker compose up dynamodb-local

cd backend
npm install
npm run local:setup
npm run local:api

cd ../frontend
npm install
npm start
```

Open `http://localhost:4200`.

See [docs/local-development.md](docs/local-development.md) for the full local workflow and AWS-dev integration mode.

## Checks

```bash
cd frontend
npm install
npm run build

cd ../backend
npm install
npm test
npm run build
```

Terraform validation:

```bash
cd infra
terraform init
terraform fmt -check
terraform validate
```

## Deployment

The main branch workflow applies Terraform, builds Lambda bundles, builds the Angular app, uploads frontend assets to S3, and invalidates CloudFront.

See [docs/setup.md](docs/setup.md) for manual prerequisites, GitHub Secrets, Google OAuth setup, deployment flow, cost controls, and security guidance.
