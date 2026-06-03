output "cloudfront_url" {
  description = "CloudFront URL for the Angular PWA."
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "frontend_bucket_name" {
  description = "S3 bucket used for frontend assets."
  value       = aws_s3_bucket.frontend.bucket
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID used for invalidations."
  value       = aws_cloudfront_distribution.frontend.id
}

output "api_url" {
  description = "API Gateway HTTP API invoke URL."
  value       = aws_apigatewayv2_api.http.api_endpoint
}

output "user_pool_id" {
  description = "Cognito User Pool ID."
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_client_id" {
  description = "Cognito User Pool App Client ID."
  value       = aws_cognito_user_pool_client.web.id
}

output "cognito_hosted_ui_base_url" {
  description = "Cognito Hosted UI base URL."
  value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${var.aws_region}.amazoncognito.com"
}

output "dynamodb_table_name" {
  description = "DynamoDB table name."
  value       = aws_dynamodb_table.expenses.name
}
