#!/usr/bin/env bash
# deploy.sh — Full deploy: build container, push to ECR, update Lambda, redeploy ECS
# Usage: ./deploy.sh [--skip-lambda] [--skip-frontend]
set -euo pipefail

# ── Config (auto-populated from Terraform outputs) ──────────────────────────
AWS_REGION=$(terraform -chdir=terraform output -raw aws_region 2>/dev/null || echo "us-east-1")
ECR_URL=$(terraform -chdir=terraform output -raw ecr_repository_url)
ECS_CLUSTER=$(terraform -chdir=terraform output -raw ecs_cluster_name)
ECS_SERVICE=$(terraform -chdir=terraform output -raw ecs_service_name)
LAMBDA_NAME=$(terraform -chdir=terraform output -raw lambda_function_name)
API_URL=$(terraform -chdir=terraform output -raw api_url)
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

SKIP_LAMBDA=false
SKIP_FRONTEND=false

for arg in "$@"; do
  [[ "$arg" == "--skip-lambda" ]] && SKIP_LAMBDA=true
  [[ "$arg" == "--skip-frontend" ]] && SKIP_FRONTEND=true
done

echo "────────────────────────────────────────────"
echo "  FriedmanFit Deploy"
echo "  Region:  $AWS_REGION"
echo "  ECR:     $ECR_URL"
echo "  Cluster: $ECS_CLUSTER"
echo "────────────────────────────────────────────"

# ── Lambda ───────────────────────────────────────────────────────────────────
if [[ "$SKIP_LAMBDA" == false ]]; then
  echo ""
  echo "▶ Packaging Lambda..."
  cd lambda
  npm install --omit=dev
  cd ..
  zip -r terraform/lambda.zip lambda/ -x "lambda/*.md"

  echo "▶ Updating Lambda function code..."
  aws lambda update-function-code \
    --function-name "$LAMBDA_NAME" \
    --zip-file fileb://terraform/lambda.zip \
    --region "$AWS_REGION" \
    --output json | jq -r '.FunctionName + " updated"'

  echo "▶ Waiting for Lambda update..."
  aws lambda wait function-updated \
    --function-name "$LAMBDA_NAME" \
    --region "$AWS_REGION"
  echo "  ✓ Lambda deployed"
fi

# ── Frontend Container ────────────────────────────────────────────────────────
if [[ "$SKIP_FRONTEND" == false ]]; then
  echo ""
  echo "▶ Logging into ECR..."
  aws ecr get-login-password --region "$AWS_REGION" | \
    docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

  echo "▶ Building Docker image..."
  docker build \
    --build-arg VITE_API_URL="$API_URL" \
    -t "${ECR_URL}:latest" \
    -t "${ECR_URL}:$(git rev-parse --short HEAD 2>/dev/null || echo 'latest')" \
    frontend/

  echo "▶ Pushing to ECR..."
  docker push "${ECR_URL}:latest"
  docker push "${ECR_URL}:$(git rev-parse --short HEAD 2>/dev/null || echo 'latest')" 2>/dev/null || true

  echo "▶ Forcing ECS redeployment..."
  aws ecs update-service \
    --cluster "$ECS_CLUSTER" \
    --service "$ECS_SERVICE" \
    --force-new-deployment \
    --region "$AWS_REGION" \
    --output json | jq -r '.service.serviceName + " redeploying..."'

  echo "▶ Waiting for ECS service stability (this takes ~2 min)..."
  aws ecs wait services-stable \
    --cluster "$ECS_CLUSTER" \
    --services "$ECS_SERVICE" \
    --region "$AWS_REGION"
  echo "  ✓ Frontend deployed"
fi

echo ""
echo "────────────────────────────────────────────"
echo "  ✅ Deploy complete"
echo "  Frontend: $(terraform -chdir=terraform output -raw frontend_url)"
echo "  API:      $API_URL"
echo "────────────────────────────────────────────"
