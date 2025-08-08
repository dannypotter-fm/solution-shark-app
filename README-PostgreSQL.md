# SolutionShark PostgreSQL Database Setup

This document describes the PostgreSQL database setup for SolutionShark, including the database schema, API routes, and deployment instructions.

## 🗄️ Database Architecture

### Overview
SolutionShark uses **PostgreSQL** with **AWS Aurora Serverless v2** for cost-efficient, production-ready database management. The database is accessed through **AWS RDS Data API** from Lambda functions, providing secure and scalable data access.

### Key Features
- ✅ **Aurora Serverless v2** - Scales to 0 when not in use (cost optimization)
- ✅ **AWS RDS Data API** - Secure database access from Lambda functions
- ✅ **Secrets Manager** - Secure credential management
- ✅ **VPC Isolation** - Database in private subnets
- ✅ **Encryption at Rest** - KMS-managed encryption
- ✅ **Point-in-Time Recovery** - 7-day backup retention
- ✅ **High Availability** - Multi-AZ deployment

## 📊 Database Schema

### Core Tables

#### 1. Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'user',
    avatar_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Solutions Table
```sql
CREATE TABLE solutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    customer VARCHAR(255),
    opportunity VARCHAR(255),
    estimated_value DECIMAL(15,2),
    amount DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'USD',
    stage solution_stage DEFAULT 'draft',
    owner_id UUID REFERENCES users(id),
    project_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    last_modified_by UUID REFERENCES users(id)
);
```

#### 3. Approval Workflows Table
```sql
CREATE TABLE approval_workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);
```

#### 4. Workflow Steps Table
```sql
CREATE TABLE workflow_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES approval_workflows(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    step_order INTEGER NOT NULL,
    requires_all_approvers BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. Workflow Step Approvers Table
```sql
CREATE TABLE workflow_step_approvers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    step_id UUID REFERENCES workflow_steps(id) ON DELETE CASCADE,
    approver_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### 6. Approvals Table
```sql
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solution_id UUID REFERENCES solutions(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES approval_workflows(id),
    requester_id UUID REFERENCES users(id),
    status approval_status DEFAULT 'pending',
    current_step_id UUID REFERENCES workflow_steps(id),
    current_step_order INTEGER DEFAULT 1,
    total_steps INTEGER DEFAULT 1,
    priority approval_priority DEFAULT 'medium',
    notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID REFERENCES users(id)
);
```

#### 7. Approval History Table
```sql
CREATE TABLE approval_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    approval_id UUID REFERENCES approvals(id) ON DELETE CASCADE,
    step_id UUID REFERENCES workflow_steps(id),
    approver_id UUID REFERENCES users(id),
    action approval_status NOT NULL,
    notes TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### 8. Workflow Rules Table
```sql
CREATE TABLE workflow_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES approval_workflows(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    operator VARCHAR(20) NOT NULL,
    field_value TEXT,
    rule_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Custom Types
```sql
CREATE TYPE solution_stage AS ENUM ('draft', 'review', 'approved', 'rejected');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE user_role AS ENUM ('user', 'approval_manager', 'admin');
CREATE TYPE approval_priority AS ENUM ('low', 'medium', 'high');
```

### Views
```sql
-- Solution Summary View
CREATE VIEW solution_summary AS
SELECT 
    s.id, s.name, s.customer, s.stage, s.estimated_value, s.currency,
    s.created_at, u.name as owner_name, u.email as owner_email,
    COUNT(a.id) as approval_count,
    COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending_approvals
FROM solutions s
LEFT JOIN users u ON s.owner_id = u.id
LEFT JOIN approvals a ON s.id = a.solution_id
GROUP BY s.id, s.name, s.customer, s.stage, s.estimated_value, 
         s.currency, s.created_at, u.name, u.email;

-- Approval Summary View
CREATE VIEW approval_summary AS
SELECT 
    a.id, a.solution_id, s.name as solution_name, w.name as workflow_name,
    a.status, a.priority, a.submitted_at, u.name as requester_name,
    u.email as requester_email, a.current_step_order, a.total_steps
FROM approvals a
JOIN solutions s ON a.solution_id = s.id
JOIN approval_workflows w ON a.workflow_id = w.id
JOIN users u ON a.requester_id = u.id;
```

## 🔌 API Routes

### Solutions API (`/api/solutions`)

#### GET `/api/solutions`
- **Description**: Get all solutions with summary information
- **Response**: Array of solution objects with approval counts
- **Query Parameters**: 
  - `stage` - Filter by solution stage
  - `owner` - Filter by owner ID

#### GET `/api/solutions/{id}`
- **Description**: Get a specific solution by ID
- **Response**: Solution object with full details

#### POST `/api/solutions`
- **Description**: Create a new solution
- **Request Body**: Solution object
- **Response**: Created solution object

#### PUT `/api/solutions/{id}`
- **Description**: Update an existing solution
- **Request Body**: Partial solution object
- **Response**: Updated solution object

#### DELETE `/api/solutions/{id}`
- **Description**: Delete a solution and related approvals
- **Response**: 204 No Content

### Approvals API (`/api/approvals`)

#### GET `/api/approvals`
- **Description**: Get all approvals with summary information
- **Response**: Array of approval objects with solution and workflow details

#### GET `/api/approvals/{id}`
- **Description**: Get a specific approval by ID
- **Response**: Approval object with full details

#### POST `/api/approvals`
- **Description**: Create a new approval
- **Request Body**: Approval object
- **Response**: Created approval object
- **Side Effects**: Updates solution stage to 'review'

#### PUT `/api/approvals/{id}`
- **Description**: Update an approval (approve/reject)
- **Request Body**: Partial approval object
- **Response**: Updated approval object
- **Side Effects**: Updates solution stage based on approval status

### Workflows API (`/api/workflows`)

#### GET `/api/workflows`
- **Description**: Get all approval workflows
- **Response**: Array of workflow objects with step and rule counts

#### GET `/api/workflows/{id}`
- **Description**: Get a specific workflow with steps and rules
- **Response**: Workflow object with steps and rules arrays

#### POST `/api/workflows`
- **Description**: Create a new approval workflow
- **Request Body**: Workflow object with steps and rules
- **Response**: Created workflow object

#### PUT `/api/workflows/{id}`
- **Description**: Update an existing workflow
- **Request Body**: Workflow object with steps and rules
- **Response**: Updated workflow object

#### DELETE `/api/workflows/{id}`
- **Description**: Delete a workflow and related steps/rules
- **Response**: 204 No Content

## 🚀 Deployment

### Prerequisites
1. AWS CLI configured with appropriate permissions
2. AWS CDK installed globally
3. Node.js 18+ installed
4. PostgreSQL client (optional, for direct database access)

### Deployment Steps

1. **Clone and Setup**
   ```bash
   git clone <repository-url>
   cd solution-shark
   npm install
   ```

2. **Configure AWS Credentials**
   ```bash
   aws configure
   ```

3. **Deploy Infrastructure**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

4. **Verify Deployment**
   ```bash
   # Check CloudFormation stack
   aws cloudformation describe-stacks --stack-name SolutionSharkStack
   
   # Check database connectivity
   aws rds describe-db-clusters --db-cluster-identifier solution-shark-database
   ```

### Environment Variables

The following environment variables are automatically set by the CDK deployment:

```bash
# Database Configuration
DB_CLUSTER_ARN=arn:aws:rds:region:account:cluster:solution-shark-database
DB_SECRET_ARN=arn:aws:secretsmanager:region:account:secret:solution-shark/db-credentials
DB_NAME=solution_shark

# API Configuration
API_BASE_URL=https://api-gateway-url.amazonaws.com/prod
```

## 🔒 Security Features

### Database Security
- **VPC Isolation**: Database in private subnets
- **Security Groups**: Restrict access to Lambda functions only
- **Encryption at Rest**: KMS-managed encryption
- **Encryption in Transit**: TLS 1.2+ required
- **Secrets Manager**: Secure credential storage

### API Security
- **CORS Configuration**: Proper CORS headers
- **Input Validation**: All inputs validated
- **SQL Injection Protection**: Parameterized queries
- **Error Handling**: Secure error responses

## 📈 Performance Optimization

### Database Optimization
- **Indexes**: Optimized indexes on frequently queried columns
- **Connection Pooling**: Managed by RDS Data API
- **Query Optimization**: Efficient JOINs and aggregations
- **Caching**: Application-level caching for frequently accessed data

### Cost Optimization
- **Aurora Serverless v2**: Scales to 0 when not in use
- **Lambda Functions**: Pay-per-request pricing
- **API Gateway**: Pay-per-request pricing
- **Monitoring**: CloudWatch metrics for cost tracking

## 🛠️ Development

### Local Development
1. **Setup Local Database**
   ```bash
   # Install PostgreSQL locally
   brew install postgresql  # macOS
   sudo apt-get install postgresql  # Ubuntu
   
   # Create database
   createdb solution_shark
   
   # Run schema
   psql solution_shark < src/database/schema.sql
   ```

2. **Environment Variables**
   ```bash
   # Create .env.local
   DB_CLUSTER_ARN=local
   DB_SECRET_ARN=local
   DB_NAME=solution_shark
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

### Database Migrations
```bash
# Initialize database
node src/database/init-db.js

# Check database health
node -e "require('./src/database/init-db').checkDatabaseHealth()"
```

## 📊 Monitoring and Logging

### CloudWatch Metrics
- **Database Metrics**: CPU, memory, connections
- **Lambda Metrics**: Duration, errors, invocations
- **API Gateway Metrics**: Request count, latency, errors

### Logging
- **Lambda Logs**: CloudWatch Logs for each function
- **Database Logs**: RDS CloudWatch Logs
- **Application Logs**: Structured logging with correlation IDs

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   # Check security groups
   aws ec2 describe-security-groups --group-ids sg-xxxxx
   
   # Check VPC configuration
   aws ec2 describe-vpcs --vpc-ids vpc-xxxxx
   ```

2. **Lambda Function Errors**
   ```bash
   # View Lambda logs
   aws logs describe-log-groups --log-group-name-prefix /aws/lambda/solution-shark
   ```

3. **API Gateway Errors**
   ```bash
   # Check API Gateway logs
   aws logs describe-log-groups --log-group-name-prefix API-Gateway-Execution-Logs
   ```

### Performance Issues
1. **Slow Queries**: Check CloudWatch RDS metrics
2. **High Lambda Duration**: Optimize database queries
3. **API Timeouts**: Increase Lambda timeout settings

## 💰 Cost Estimation

### Monthly Costs (Estimated)
- **Aurora Serverless v2**: $50-200/month (depends on usage)
- **Lambda Functions**: $5-20/month
- **API Gateway**: $5-15/month
- **Secrets Manager**: $0.40/month per secret
- **CloudWatch**: $5-10/month
- **Total**: $65-245/month

### Cost Optimization Tips
1. **Monitor Usage**: Use CloudWatch metrics
2. **Right-size Resources**: Adjust Aurora capacity
3. **Cache Frequently**: Implement application caching
4. **Optimize Queries**: Use database indexes effectively

## 📚 Additional Resources

- [AWS Aurora Serverless v2 Documentation](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/aurora-serverless-v2.html)
- [AWS RDS Data API Documentation](https://docs.aws.amazon.com/rdsdataservice/latest/APIReference/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/api/v2/)

---

For support or questions, please refer to the main project documentation or create an issue in the repository. 