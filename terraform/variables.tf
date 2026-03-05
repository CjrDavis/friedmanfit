variable "aws_region" {
  description = "AWS region for all resources (except ACM for API GW which is always us-east-1)"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "domain_name" {
  description = "Root domain name (e.g. friedman.fit or macros.friedman.fit)"
  type        = string
}

variable "anthropic_api_key" {
  description = "Anthropic API key for Lambda — store this in terraform.tfvars or AWS Secrets Manager"
  type        = string
  sensitive   = true
}

variable "ecs_desired_count" {
  description = "Number of ECS Fargate tasks to run"
  type        = number
  default     = 1
}
