// Configuration for API endpoints
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
  ENDPOINTS: {
    SOLUTIONS: '/solutions',
    APPROVALS: '/approvals',
    WORKFLOWS: '/workflows',
  }
}

// Database configuration (for server-side only)
export const DB_CONFIG = {
  CLUSTER_ARN: process.env.DB_CLUSTER_ARN,
  SECRET_ARN: process.env.DB_SECRET_ARN,
  NAME: process.env.DB_NAME || 'solution_shark',
  REGION: process.env.AWS_REGION || 'us-east-1',
} 