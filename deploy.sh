#!/bin/bash

# SolutionShark AWS Deployment Script
# This script deploys the entire infrastructure to AWS

set -e

echo "🚀 Starting SolutionShark AWS Deployment..."

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS CDK is installed
if ! command -v cdk &> /dev/null; then
    echo "❌ AWS CDK is not installed. Installing..."
    npm install -g aws-cdk
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the solution-shark directory"
    exit 1
fi

# Build the Next.js application
echo "📦 Building Next.js application..."
npm run build

# Check if build was successful
if [ ! -d ".next" ]; then
    echo "❌ Build failed. Please check the build output."
    exit 1
fi

echo "✅ Next.js build completed successfully"

# Navigate to infrastructure directory
cd infrastructure

# Install dependencies
echo "📦 Installing CDK dependencies..."
npm install

# Build CDK
echo "🔨 Building CDK..."
npm run build

# Bootstrap CDK (if needed)
echo "🚀 Bootstrapping CDK..."
cdk bootstrap

# Deploy the stack
echo "🚀 Deploying SolutionShark stack to AWS..."
cdk deploy --require-approval never

# Get the outputs
echo "📋 Getting deployment outputs..."
cdk list-exports

echo "✅ Deployment completed successfully!"
echo ""
echo "🌐 Your application is now deployed at:"
echo "   - Frontend: https://[Amplify URL]"
echo "   - API: https://[API Gateway URL]"
echo ""
echo "📊 You can view your resources in the AWS Console:"
echo "   - CloudFormation: https://console.aws.amazon.com/cloudformation"
echo "   - Amplify: https://console.aws.amazon.com/amplify"
echo "   - DynamoDB: https://console.aws.amazon.com/dynamodb"
echo "   - Lambda: https://console.aws.amazon.com/lambda"
echo "   - API Gateway: https://console.aws.amazon.com/apigateway"
echo ""
echo "💰 Estimated monthly costs:"
echo "   - DynamoDB (pay-per-request): ~$5-20/month"
echo "   - Lambda (serverless): ~$1-5/month"
echo "   - Amplify: ~$1-3/month"
echo "   - API Gateway: ~$1-3/month"
echo "   - WAF: ~$5/month"
echo "   - Total: ~$15-35/month"
echo ""
echo "🔧 To update the deployment:"
echo "   cd infrastructure && cdk deploy"
echo ""
echo "🗑️  To destroy the stack:"
echo "   cd infrastructure && cdk destroy" 