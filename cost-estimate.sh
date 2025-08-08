#!/bin/bash

# SolutionShark AWS Cost Estimation Script
# This script provides cost estimates for different usage patterns

echo "💰 SolutionShark AWS Cost Estimation"
echo "====================================="
echo ""

# Function to calculate costs
calculate_costs() {
    local requests_per_month=$1
    local data_transfer_gb=$2
    local storage_gb=$3
    
    echo "📊 Usage Parameters:"
    echo "   - API Requests: $requests_per_month/month"
    echo "   - Data Transfer: $data_transfer_gb GB/month"
    echo "   - Storage: $storage_gb GB"
    echo ""
    
    # Lambda costs (us-east-1 pricing)
    local lambda_requests=$requests_per_month
    local lambda_duration_ms=500  # Average 500ms per request
    local lambda_memory_gb=0.512  # 512MB
    local lambda_cost_per_1ms=0.0000000021
    local lambda_cost_per_request=0.0000002
    
    local lambda_compute_cost=$(echo "scale=6; $lambda_requests * $lambda_duration_ms * $lambda_memory_gb * $lambda_cost_per_1ms" | bc)
    local lambda_request_cost=$(echo "scale=6; $lambda_requests * $lambda_cost_per_request" | bc)
    local lambda_total=$(echo "scale=6; $lambda_compute_cost + $lambda_request_cost" | bc)
    
    # API Gateway costs
    local api_cost_per_request=0.000004
    local api_cost_per_1mb=0.0000009
    local api_data_mb=$(echo "scale=6; $data_transfer_gb * 1024" | bc)
    
    local api_request_cost=$(echo "scale=6; $lambda_requests * $api_cost_per_request" | bc)
    local api_data_cost=$(echo "scale=6; $api_data_mb * $api_cost_per_1mb" | bc)
    local api_total=$(echo "scale=6; $api_request_cost + $api_data_cost" | bc)
    
    # DynamoDB costs (pay-per-request)
    local dynamodb_read_units=$((requests_per_month * 2))  # Assume 2 reads per request
    local dynamodb_write_units=$((requests_per_month / 10))  # Assume 1 write per 10 requests
    local dynamodb_storage_gb=$storage_gb
    
    local dynamodb_read_cost=$(echo "scale=6; $dynamodb_read_units * 0.00000025" | bc)
    local dynamodb_write_cost=$(echo "scale=6; $dynamodb_write_units * 0.00000125" | bc)
    local dynamodb_storage_cost=$(echo "scale=6; $dynamodb_storage_gb * 0.25" | bc)
    local dynamodb_total=$(echo "scale=6; $dynamodb_read_cost + $dynamodb_write_cost + $dynamodb_storage_cost" | bc)
    
    # CloudFront costs
    local cloudfront_requests=$((requests_per_month * 3))  # Assume 3x more requests due to caching
    local cloudfront_cost_per_10k_requests=0.0075
    local cloudfront_data_cost_per_gb=0.085
    
    local cloudfront_request_cost=$(echo "scale=6; $cloudfront_requests / 10000 * $cloudfront_cost_per_10k_requests" | bc)
    local cloudfront_data_cost=$(echo "scale=6; $data_transfer_gb * $cloudfront_data_cost_per_gb" | bc)
    local cloudfront_total=$(echo "scale=6; $cloudfront_request_cost + $cloudfront_data_cost" | bc)
    
    # S3 costs
    local s3_storage_cost=$(echo "scale=6; $storage_gb * 0.023" | bc)
    local s3_requests_cost=$(echo "scale=6; $requests_per_month * 0.0000004" | bc)
    local s3_total=$(echo "scale=6; $s3_storage_cost + $s3_requests_cost" | bc)
    
    # WAF costs
    local waf_requests=$((requests_per_month * 3))  # CloudFront requests
    local waf_cost_per_1m_requests=1.00
    local waf_cost=$(echo "scale=6; $waf_requests / 1000000 * $waf_cost_per_1m_requests" | bc)
    
    # KMS costs
    local kms_cost=1.00  # Fixed cost for customer-managed key
    
    # Total costs
    local total=$(echo "scale=6; $lambda_total + $api_total + $dynamodb_total + $cloudfront_total + $s3_total + $waf_cost + $kms_cost" | bc)
    
    echo "💵 Cost Breakdown:"
    echo "   Lambda:        \$$(printf "%.2f" $lambda_total)"
    echo "   API Gateway:   \$$(printf "%.2f" $api_total)"
    echo "   DynamoDB:      \$$(printf "%.2f" $dynamodb_total)"
    echo "   CloudFront:    \$$(printf "%.2f" $cloudfront_total)"
    echo "   S3:            \$$(printf "%.2f" $s3_total)"
    echo "   WAF:           \$$(printf "%.2f" $waf_cost)"
    echo "   KMS:           \$$(printf "%.2f" $kms_cost)"
    echo "   ─────────────────────────"
    echo "   Total:         \$$(printf "%.2f" $total)"
    echo ""
}

# Check if bc is installed
if ! command -v bc &> /dev/null; then
    echo "❌ 'bc' calculator is required. Install it with:"
    echo "   macOS: brew install bc"
    echo "   Ubuntu: sudo apt-get install bc"
    exit 1
fi

echo "📈 Cost Scenarios:"
echo ""

echo "1️⃣  Low Traffic (Development/Testing)"
echo "   - 1,000 API requests/month"
echo "   - 1 GB data transfer/month"
echo "   - 0.1 GB storage"
calculate_costs 1000 1 0.1

echo "2️⃣  Medium Traffic (Small Business)"
echo "   - 10,000 API requests/month"
echo "   - 10 GB data transfer/month"
echo "   - 1 GB storage"
calculate_costs 10000 10 1

echo "3️⃣  High Traffic (Growing Business)"
echo "   - 100,000 API requests/month"
echo "   - 100 GB data transfer/month"
echo "   - 10 GB storage"
calculate_costs 100000 100 10

echo "4️⃣  Enterprise Traffic (Large Business)"
echo "   - 1,000,000 API requests/month"
echo "   - 1,000 GB data transfer/month"
echo "   - 100 GB storage"
calculate_costs 1000000 1000 100

echo "💡 Cost Optimization Tips:"
echo "   ✅ Use CloudFront caching to reduce origin requests"
echo "   ✅ Implement DynamoDB GSI for efficient queries"
echo "   ✅ Enable Lambda provisioned concurrency for critical paths"
echo "   ✅ Use S3 lifecycle policies to reduce storage costs"
echo "   ✅ Monitor with CloudWatch to identify optimization opportunities"
echo ""
echo "🔗 Useful Links:"
echo "   - AWS Pricing Calculator: https://calculator.aws/"
echo "   - CloudWatch Cost Insights: https://console.aws.amazon.com/cost-reports/"
echo "   - AWS Cost Optimization: https://aws.amazon.com/cost-optimization/" 