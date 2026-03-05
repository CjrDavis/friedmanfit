# FriedmanFit — Macro Meal Builder

AI-powered meal planner for FriedmanFit clients. Enter your remaining macros + available foods → get 3 optimized meal combos with exact oz/gram amounts.

## Architecture

```
Route 53 (DNS)
  ├── macros.friedman.fit  →  ALB  →  ECS Fargate (nginx + React)
  └── api.friedman.fit     →  API Gateway HTTP  →  Lambda (Node 20)
                                                         └── Anthropic Claude API
```

**Infrastructure:**
- **ECS Fargate** — containerized React/nginx frontend
- **Lambda + API Gateway v2** — serverless backend, keeps API key server-side
- **ECR** — Docker image registry
- **Route 53** — DNS + domain
- **ACM** — SSL/TLS certificates (auto-renewed)
- **VPC** — public subnets (ALB), private subnets (ECS tasks), NAT Gateway

---

## Prerequisites

```bash
# Install required tools
brew install terraform awscli

# macOS Docker Desktop or colima
brew install --cask docker

# Configure AWS credentials
aws configure
# Enter: Access Key ID, Secret Access Key, region (us-east-1), output (json)
```

Verify access:
```bash
aws sts get-caller-identity
```

---

## Step 1 — Register Your Domain

1. Go to **AWS Console → Route 53 → Domains → Register Domain**
2. Search for your domain (e.g. `macros.friedman.fit` or a new domain)
3. Complete purchase (~$12/yr for .com)
4. Wait ~15 min for registration to complete

> If you already own the domain elsewhere (GoDaddy, Namecheap, etc.), you'll point your NS records to Route 53 after Terraform creates the hosted zone.

---

## Step 2 — Configure Terraform

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:
```hcl
aws_region        = "us-east-1"
domain_name       = "macros.friedman.fit"  # your domain
anthropic_api_key = "sk-ant-api03-..."      # from console.anthropic.com
ecs_desired_count = 1
```

> ⚠️ Never commit `terraform.tfvars` — it's in `.gitignore`

---

## Step 3 — Initial Terraform Deploy

```bash
cd terraform

# Initialize providers
terraform init

# Preview what will be created
terraform plan

# Deploy (~5-10 min)
terraform apply
```

After apply, note the outputs:
```
frontend_url           = "https://macros.friedman.fit"
api_url                = "https://api.macros.friedman.fit"
ecr_repository_url     = "123456789.dkr.ecr.us-east-1.amazonaws.com/friedmanfit/frontend"
route53_name_servers   = ["ns-xxx.awsdns-xx.com", ...]
```

**If domain registered outside AWS:** Copy the `route53_name_servers` values into your registrar's NS records.

---

## Step 4 — Install Lambda Dependencies

```bash
cd lambda
npm install
cd ..
```

---

## Step 5 — Build & Deploy

```bash
chmod +x deploy.sh
./deploy.sh
```

This script:
1. Packages Lambda + dependencies → zips → updates function
2. Builds Docker image with `VITE_API_URL` baked in
3. Pushes to ECR
4. Forces ECS redeployment
5. Waits for service stability

**Partial deploys:**
```bash
./deploy.sh --skip-lambda      # frontend only
./deploy.sh --skip-frontend    # lambda only
```

---

## Project Structure

```
friedmanfit/
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Main React app
│   │   └── main.jsx         # Entry point
│   ├── Dockerfile           # Multi-stage: node build → nginx serve
│   ├── nginx.conf           # SPA routing + health check
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── lambda/
│   ├── index.mjs            # Lambda handler → Anthropic API
│   └── package.json
│
├── terraform/
│   ├── main.tf              # All AWS resources
│   ├── variables.tf
│   ├── outputs.tf
│   └── terraform.tfvars.example
│
├── deploy.sh                # One-command deploy
└── .gitignore
```

---

## Local Development

**Frontend:**
```bash
cd frontend
npm install

# Create .env.local
echo "VITE_API_URL=http://localhost:3001" > .env.local

npm run dev
# → http://localhost:5173
```

**Lambda (local test):**
```bash
cd lambda
npm install

# Quick local test
node -e "
import('./index.mjs').then(m => 
  m.handler({
    httpMethod: 'POST',
    body: JSON.stringify({
      remaining: { protein: 60, carbs: 80, fat: 20 },
      mealCount: 2,
      foods: 'chicken breast, jasmine rice, broccoli, Greek yogurt'
    })
  }).then(r => console.log(JSON.parse(r.body)))
)"
```

---

## Estimated AWS Cost

| Service | Est. Monthly |
|---------|-------------|
| ECS Fargate (0.25 vCPU, 0.5GB, ~730hrs) | ~$9 |
| ALB | ~$16 |
| NAT Gateway | ~$32 |
| Lambda (1M requests) | ~$0.20 |
| API Gateway (1M requests) | ~$1 |
| ECR storage | ~$0.10 |
| Route 53 | ~$0.50 |
| **Total** | **~$59/mo** |

> To reduce cost: use ALB with 1 ECS task, or consider migrating frontend to S3+CloudFront (~$1/mo) if you want to cut the NAT Gateway cost.

---

## Updating the App

After code changes:
```bash
# Full redeploy
./deploy.sh

# Lambda only (AI prompt changes, etc.)
./deploy.sh --skip-frontend

# Frontend only (UI changes)
./deploy.sh --skip-lambda
```

---

## Teardown

```bash
cd terraform
terraform destroy
```

> Note: ECR images must be deleted manually first, or set `force_delete = true` on the ECR resource.
