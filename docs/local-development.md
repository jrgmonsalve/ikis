# Local Development

Local mode lets developers build features without sharing the AWS `dev` stack.

## What Runs Locally

- Angular PWA on `http://localhost:4200`
- Local Node HTTP API on `http://localhost:3000`
- DynamoDB Local on `http://localhost:8001`
- Mock auth user: `local-dev-user`

AWS is still used for integration checks: Cognito Hosted UI, Google federation, API Gateway JWT authorization, Lambda deployment, IAM, S3, and CloudFront.

## First-Time Setup

Install dependencies:

```bash
cd backend
npm install

cd ../frontend
npm install
```

Start DynamoDB Local from the repo root:

```bash
docker compose up dynamodb-local
```

In another terminal, create the local table:

```bash
cd backend
npm run local:setup
```

Start the local API:

```bash
npm run local:api
```

In a third terminal, start Angular:

```bash
cd frontend
npm start
```

Open:

```text
http://localhost:4200
```

## Local API

The local API exposes the same expense routes as the deployed API:

```text
GET    /health
GET    /expenses
POST   /expenses
GET    /expenses/:id
PUT    /expenses/:id
DELETE /expenses/:id
```

The frontend default environment points to:

```text
http://localhost:3000
```

No Cognito login is required in local mode. Clicking `Sign in` stores a local session token in browser session storage, and API requests include:

```text
X-Local-User-Id: local-dev-user
```

The project uses local port `8001` for DynamoDB Local to avoid common conflicts with tools such as Portainer on port `8000`.

## Local API Smoke Test

Create an expense:

```bash
curl -X POST http://localhost:3000/expenses \
  -H 'Content-Type: application/json' \
  -H 'X-Local-User-Id: local-dev-user' \
  -d '{
    "amount": 12.5,
    "category": "Food",
    "description": "Local test",
    "expenseDate": "2026-06-02"
  }'
```

List expenses:

```bash
curl http://localhost:3000/expenses \
  -H 'X-Local-User-Id: local-dev-user'
```

## AWS Dev Integration Mode

Use this only when validating Cognito, API Gateway, Lambda, DynamoDB in AWS, or CloudFront/S3 behavior.

Create a local-only file:

```bash
cp frontend/src/environments/environment.aws-dev.example.ts frontend/src/environments/environment.aws-dev.ts
```

Fill it from Terraform outputs:

```bash
cd infra
terraform output
```

Then run:

```bash
cd frontend
npm run start:aws-dev
```

`environment.aws-dev.ts` is ignored by git so each developer can use their own AWS environment values.

## Recommended Team Flow

- Feature development: local Angular + local API + DynamoDB Local.
- Integration testing: personal or shared AWS dev stack.
- Deployment validation: GitHub Actions and Terraform-managed AWS environments.

This keeps everyday work fast and avoids multiple developers writing test data into the same shared DynamoDB table.
