# SolutionShark AWS Deployment Guide

## 🚀 Overview

This guide provides step-by-step instructions for deploying SolutionShark to AWS using a cost-efficient, serverless architecture with AWS Amplify for Next.js hosting.

## 📋 Architecture

### **Cost-Efficient Serverless Stack:**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AWS Amplify   │    │   API Gateway   │    │   Lambda        │
│   (Next.js)     │◄──►│   (Serverless)  │◄──►│   (Serverless)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub        │    │   DynamoDB      │    │   WAF           │
│   (Source)      │    │   (Serverless)  │    │   (Security)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Services Used:**

| Service | Purpose | Cost Model |
|---------|---------|------------|
| **AWS Amplify** | Next.js hosting with CI/CD | Pay per build + hosting |
| **API Gateway** | REST API management | Pay per request |
| **Lambda** | Serverless compute | Pay per execution |
| **DynamoDB** | NoSQL database | Pay per request |
| **WAF** | Web application firewall | Pay per request |
| **KMS** | Encryption key management | Pay per request |

## 💰 Cost Optimization Features

### **1. Serverless Architecture**
- ✅ **Zero idle costs** - Only pay when requests are processed
- ✅ **Auto-scaling** - Automatically scales with demand
- ✅ **Pay-per-use** - No fixed infrastructure costs

### **2. DynamoDB Pay-Per-Request**
- ✅ **No provisioned capacity** - Scales automatically
- ✅ **Cost-effective for variable workloads**
- ✅ **Built-in backup and point-in-time recovery**

### **3. Lambda Optimization**
- ✅ **512MB memory** - Optimal for most workloads
- ✅ **30-second timeout** - Prevents runaway costs
- ✅ **Cold start optimization** - Reuses containers

### **4. AWS Amplify Optimization**
- ✅ **Automatic builds** from GitHub
- ✅ **Global CDN** included
- ✅ **HTTPS enforcement** by default
- ✅ **Branch-based deployments**

## 🔒 Security Features

### **1. Encryption**
- ✅ **KMS customer-managed keys** for DynamoDB
- ✅ **HTTPS enforcement** via Amplify
- ✅ **Environment variables** for sensitive data

### **2. Network Security**
- ✅ **WAF protection** with rate limiting
- ✅ **AWS managed rules** for common attacks
- ✅ **CORS configuration** for API security

### **3. Access Control**
- ✅ **IAM roles** with least privilege
- ✅ **Resource-based policies** for fine-grained access
- ✅ **CloudTrail logging** for audit trails

## 🛠️ Prerequisites

### **1. AWS Account Setup**
```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /

# Configure AWS credentials
aws configure
```

### **2. Node.js and CDK**
```bash
# Install Node.js (if not already installed)
brew install node

# Install AWS CDK
npm install -g aws-cdk

# Verify installation
cdk --version
```

### **3. GitHub Repository**
- ✅ **Public repository** for Amplify access
- ✅ **GitHub token** for authentication
- ✅ **Main branch** for deployment

### **4. Required Permissions**
Your AWS user needs these permissions:
- CloudFormation (Full access)
- Amplify (Full access)
- DynamoDB (Full access)
- Lambda (Full access)
- API Gateway (Full access)
- IAM (Limited access for role creation)
- KMS (Limited access for key creation)
- WAF (Full access)
- Secrets Manager (Limited access)

## 🚀 Deployment Steps

### **1. Clone and Setup**
```bash
# Clone the repository
git clone <your-repo-url>
cd solution-shark

# Install dependencies
npm install
```

### **2. Configure Environment**
```bash
# Set your AWS region (optional, defaults to us-east-1)
export AWS_DEFAULT_REGION=us-east-1

# Set your AWS account ID
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
```

### **3. Store GitHub Token**
```bash
# Store your GitHub token in AWS Secrets Manager
aws secretsmanager create-secret \
  --name github-token \
  --description "GitHub token for Amplify" \
  --secret-string "your-github-token-here"
```

### **4. Deploy Infrastructure**
```bash
# Run the deployment script
./deploy.sh
```

Or deploy manually:
```bash
# Build the application
npm run build

# Deploy CDK stack
cd infrastructure
npm install
npm run build
cdk bootstrap
cdk deploy
```

## 📊 Monitoring and Management

### **1. CloudWatch Metrics**
- **Lambda**: Invocations, duration, errors
- **DynamoDB**: Read/write capacity, throttled requests
- **API Gateway**: Request count, latency, 4xx/5xx errors
- **Amplify**: Build status, deployment metrics

### **2. Cost Monitoring**
```bash
# View estimated costs
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE
```

### **3. Performance Monitoring**
- **CloudWatch Dashboards** for real-time metrics
- **X-Ray tracing** for request tracing
- **CloudWatch Logs** for application logs
- **Amplify Console** for build and deployment status

## 🔧 Maintenance and Updates

### **1. Application Updates**
```bash
# Push to GitHub to trigger automatic deployment
git push origin main
```

### **2. Infrastructure Updates**
```bash
# Update CDK stack
cd infrastructure
cdk diff
cdk deploy
```

### **3. Database Management**
```bash
# Backup DynamoDB tables
aws dynamodb create-backup \
  --table-name solution-shark-solutions \
  --backup-name solutions-backup-$(date +%Y%m%d)

# Restore from backup
aws dynamodb restore-table-from-backup \
  --target-table-name solution-shark-solutions-restored \
  --backup-arn <backup-arn>
```

## 🚨 Troubleshooting

### **Common Issues:**

#### **1. CDK Bootstrap Error**
```bash
# Bootstrap CDK in your account
cdk bootstrap aws://ACCOUNT-NUMBER/REGION
```

#### **2. Amplify Build Failures**
- ✅ **Check build logs** in Amplify Console
- ✅ **Verify GitHub token** in Secrets Manager
- ✅ **Ensure repository** is public or token has access

#### **3. Lambda Cold Starts**
- ✅ **Already optimized** with 512MB memory
- ✅ **Consider provisioned concurrency** for critical paths
- ✅ **Use Lambda Extensions** for monitoring

#### **4. DynamoDB Throttling**
- ✅ **Pay-per-request mode** handles this automatically
- ✅ **Monitor with CloudWatch** for capacity planning
- ✅ **Use exponential backoff** in application code

## 📈 Scaling Considerations

### **1. Auto-Scaling Limits**
- **Lambda**: 1000 concurrent executions (soft limit)
- **DynamoDB**: No limits in pay-per-request mode
- **API Gateway**: 10,000 requests/second (soft limit)
- **Amplify**: 1000 builds/month (free tier)

### **2. Cost Scaling**
- **Low traffic**: ~$15-35/month
- **Medium traffic**: ~$50-100/month
- **High traffic**: ~$200-500/month

### **3. Performance Optimization**
- **Enable caching** in Amplify
- **Use DynamoDB GSI** for efficient queries
- **Implement caching** in Lambda functions
- **Optimize bundle size** for faster loading

## 🔐 Security Best Practices

### **1. Regular Security Updates**
```bash
# Update dependencies
npm audit fix
npm update

# Scan for vulnerabilities
npm audit
```

### **2. Access Management**
- **Rotate access keys** regularly
- **Use IAM roles** instead of access keys
- **Enable MFA** for all users
- **Monitor CloudTrail** for suspicious activity

### **3. Data Protection**
- **Enable encryption** at rest and in transit
- **Implement backup** strategies
- **Use VPC** for private resources (if needed)
- **Enable CloudWatch** alarms for security events

## 📞 Support

### **AWS Support**
- **Basic**: Email support
- **Developer**: 12-hour response
- **Business**: 4-hour response
- **Enterprise**: 1-hour response

### **Cost Optimization**
- **AWS Cost Explorer** for detailed cost analysis
- **AWS Budgets** for cost alerts
- **AWS Trusted Advisor** for optimization recommendations

## 🎯 Next Steps

1. **Set up monitoring** with CloudWatch dashboards
2. **Configure alerts** for cost and performance
3. **Add custom domain** with Route 53
4. **Set up backup** and disaster recovery
5. **Implement authentication** with Cognito
6. **Add analytics** with Google Analytics or AWS Pinpoint
7. **Set up staging environment** with different branches

---

**Estimated Monthly Costs: $15-35** for typical usage patterns.
**Deployment Time: 10-15 minutes** for initial setup.
**Maintenance: Minimal** with serverless architecture. 