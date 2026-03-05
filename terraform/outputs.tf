output "frontend_url" {
  description = "Frontend URL"
  value       = "https://${var.domain_name}"
}

output "api_url" {
  description = "API Gateway URL"
  value       = "https://api.${var.domain_name}"
}

output "ecr_repository_url" {
  description = "ECR repo URL — use this in your deploy script"
  value       = aws_ecr_repository.frontend.repository_url
}

output "alb_dns_name" {
  description = "ALB DNS name (for debugging)"
  value       = aws_lb.main.dns_name
}

output "route53_name_servers" {
  description = "COPY THESE into your domain registrar's NS records if domain was registered outside Route 53"
  value       = data.aws_route53_zone.main.name_servers
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "ECS service name — used in deploy script"
  value       = aws_ecs_service.frontend.name
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.meals.function_name
}
