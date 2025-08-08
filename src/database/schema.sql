-- SolutionShark PostgreSQL Database Schema
-- This file contains the complete database schema for the SolutionShark application

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE solution_stage AS ENUM ('draft', 'review', 'approved', 'rejected');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE user_role AS ENUM ('user', 'approval_manager', 'admin');
CREATE TYPE approval_priority AS ENUM ('low', 'medium', 'high');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'user',
    avatar_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Solutions table
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

-- Approval workflows table
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

-- Workflow rules table
CREATE TABLE workflow_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES approval_workflows(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    operator VARCHAR(20) NOT NULL, -- 'equals', 'contains', 'greater_than', etc.
    field_value TEXT,
    rule_order INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workflow steps table
CREATE TABLE workflow_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID REFERENCES approval_workflows(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    step_order INTEGER NOT NULL,
    requires_all_approvers BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workflow step approvers table (many-to-many relationship)
CREATE TABLE workflow_step_approvers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    step_id UUID REFERENCES workflow_steps(id) ON DELETE CASCADE,
    approver_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Approvals table
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

-- Approval history table
CREATE TABLE approval_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    approval_id UUID REFERENCES approvals(id) ON DELETE CASCADE,
    step_id UUID REFERENCES workflow_steps(id),
    approver_id UUID REFERENCES users(id),
    action approval_status NOT NULL,
    notes TEXT,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_solutions_stage ON solutions(stage);
CREATE INDEX idx_solutions_owner ON solutions(owner_id);
CREATE INDEX idx_solutions_created_at ON solutions(created_at);
CREATE INDEX idx_approvals_solution_id ON approvals(solution_id);
CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_approvals_workflow_id ON approvals(workflow_id);
CREATE INDEX idx_workflow_rules_workflow_id ON workflow_rules(workflow_id);
CREATE INDEX idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX idx_workflow_step_approvers_step_id ON workflow_step_approvers(step_id);
CREATE INDEX idx_approval_history_approval_id ON approval_history(approval_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_solutions_updated_at BEFORE UPDATE ON solutions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_approval_workflows_updated_at BEFORE UPDATE ON approval_workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user
INSERT INTO users (id, email, name, role) VALUES 
    (uuid_generate_v4(), 'admin@solution-shark.com', 'System Administrator', 'admin');

-- Create views for common queries
CREATE VIEW solution_summary AS
SELECT 
    s.id,
    s.name,
    s.customer,
    s.stage,
    s.estimated_value,
    s.currency,
    s.created_at,
    u.name as owner_name,
    u.email as owner_email,
    COUNT(a.id) as approval_count,
    COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending_approvals
FROM solutions s
LEFT JOIN users u ON s.owner_id = u.id
LEFT JOIN approvals a ON s.id = a.solution_id
GROUP BY s.id, s.name, s.customer, s.stage, s.estimated_value, s.currency, s.created_at, u.name, u.email;

CREATE VIEW approval_summary AS
SELECT 
    a.id,
    a.solution_id,
    s.name as solution_name,
    w.name as workflow_name,
    a.status,
    a.priority,
    a.submitted_at,
    u.name as requester_name,
    u.email as requester_email,
    a.current_step_order,
    a.total_steps
FROM approvals a
JOIN solutions s ON a.solution_id = s.id
JOIN approval_workflows w ON a.workflow_id = w.id
JOIN users u ON a.requester_id = u.id; 