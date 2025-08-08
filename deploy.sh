#!/bin/bash

# SolutionShark AWS Deployment Script
# This script deploys the complete SolutionShark application to AWS

set -e  # Exit on any error

echo "🚀 Starting SolutionShark deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials are not configured. Please run 'aws configure' first."
    exit 1
fi

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    print_error "AWS CDK is not installed. Please install it first: npm install -g aws-cdk"
    exit 1
fi

print_status "Building Next.js application..."
npm run build

if [ ! -d ".next" ]; then
    print_error "Build failed. .next directory not found."
    exit 1
fi

print_success "Next.js build completed"

# Navigate to infrastructure directory
cd infrastructure

print_status "Installing CDK dependencies..."
npm install

print_status "Building CDK application..."
npm run build

print_status "Bootstrapping CDK (if needed)..."
cdk bootstrap

print_status "Deploying infrastructure to AWS..."
cdk deploy --require-approval never

print_success "Infrastructure deployment completed!"

# Get deployment outputs
print_status "Getting deployment outputs..."
API_URL=$(aws cloudformation describe-stacks --stack-name SolutionSharkStack --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' --output text)
DB_ENDPOINT=$(aws cloudformation describe-stacks --stack-name SolutionSharkStack --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' --output text)
DB_PORT=$(aws cloudformation describe-stacks --stack-name SolutionSharkStack --query 'Stacks[0].Outputs[?OutputKey==`DatabasePort`].OutputValue' --output text)
DB_NAME=$(aws cloudformation describe-stacks --stack-name SolutionSharkStack --query 'Stacks[0].Outputs[?OutputKey==`DatabaseName`].OutputValue' --output text)
AMPLIFY_URL=$(aws cloudformation describe-stacks --stack-name SolutionSharkStack --query 'Stacks[0].Outputs[?OutputKey==`AmplifyAppUrl`].OutputValue' --output text)
AMPLIFY_APP_ID=$(aws cloudformation describe-stacks --stack-name SolutionSharkStack --query 'Stacks[0].Outputs[?OutputKey==`AmplifyAppId`].OutputValue' --output text)

print_success "Deployment outputs retrieved"

# Initialize database
print_status "Initializing PostgreSQL database..."
cd ../src/database

# Create a temporary script to initialize the database
cat > init-db-temp.js << 'EOF'
const { initializeDatabase, insertSampleData } = require('./init-db');

async function main() {
    try {
        console.log('Initializing database...');
        await initializeDatabase();
        console.log('Inserting sample data...');
        await insertSampleData();
        console.log('Database initialization completed successfully!');
    } catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
}

main();
EOF

# Run database initialization
node init-db-temp.js

# Clean up temporary file
rm init-db-temp.js

print_success "Database initialization completed"

# Navigate back to root
cd ../../

# Display deployment summary
echo ""
echo "🎉 SolutionShark deployment completed successfully!"
echo ""
echo "📊 Deployment Summary:"
echo "======================"
echo "🌐 Frontend URL: $AMPLIFY_URL"
echo "🔗 API Gateway URL: $API_URL"
echo "🗄️  Database Endpoint: $DB_ENDPOINT:$DB_PORT"
echo "📁 Database Name: $DB_NAME"
echo "🆔 Amplify App ID: $AMPLIFY_APP_ID"
echo ""
echo "📋 Next Steps:"
echo "=============="
echo "1. Configure your GitHub repository for Amplify deployment"
echo "2. Set up environment variables in Amplify console"
echo "3. Configure custom domain (optional)"
echo "4. Set up monitoring and alerts"
echo ""
echo "🔧 Useful Commands:"
echo "==================="
echo "• View logs: aws logs describe-log-groups"
echo "• Monitor costs: aws ce get-cost-and-usage"
echo "• Update stack: cd infrastructure && cdk deploy"
echo "• Destroy stack: cd infrastructure && cdk destroy"
echo ""
echo "💰 Cost Optimization Tips:"
echo "========================="
echo "• Aurora Serverless v2 scales to 0 when not in use"
echo "• Lambda functions are pay-per-request"
echo "• CloudFront caching reduces API calls"
echo "• Monitor usage with AWS Cost Explorer"
echo ""

print_success "Deployment script completed successfully!" 