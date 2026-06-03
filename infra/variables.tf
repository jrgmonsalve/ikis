variable "project_name" {
  description = "Base project name used in AWS resource names."
  type        = string
  default     = "expense-control"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for regional resources."
  type        = string
  default     = "us-east-1"
}

variable "google_client_id" {
  description = "Google OAuth client ID for Cognito federation."
  type        = string
}

variable "google_client_secret" {
  description = "Google OAuth client secret for Cognito federation."
  type        = string
  sensitive   = true
}

variable "callback_urls" {
  description = "Allowed Cognito callback URLs."
  type        = list(string)
}

variable "logout_urls" {
  description = "Allowed Cognito logout URLs."
  type        = list(string)
}

variable "lambda_package_dir" {
  description = "Directory containing esbuild Lambda bundle folders."
  type        = string
  default     = "../backend/build"
}
