# Terraform

This directory provisions the AWS resources for the expense tracker.

## Optional Remote Backend

For team deployments, create an S3 bucket and DynamoDB lock table manually, then add a backend block to `versions.tf`.

```hcl
terraform {
  backend "s3" {
    bucket         = "your-terraform-state-bucket"
    key            = "expense-control/dev/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "your-terraform-locks"
    encrypt        = true
  }
}
```

Do not commit secrets or environment-specific `*.tfvars` files.
