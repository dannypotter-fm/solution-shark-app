import { executeQuery } from './connection';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Initialize the database with the schema
 */
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('Initializing database...');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 100)}...`);
        await executeQuery(statement);
      }
    }
    
    console.log('Database initialization completed successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

/**
 * Check if the database is properly initialized
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    // Check if the main tables exist
    const tables = ['users', 'solutions', 'approval_workflows', 'approvals'];
    
    for (const table of tables) {
      const result = await executeQuery(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [table]
      );
      
      if (!result.records || result.records.length === 0 || !result.records[0][0].booleanValue) {
        console.error(`Table ${table} does not exist`);
        return false;
      }
    }
    
    console.log('Database health check passed');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Insert sample data for testing
 */
export async function insertSampleData(): Promise<void> {
  try {
    console.log('Inserting sample data...');
    
    // Insert sample users
    const users = [
      { name: 'John Doe', email: 'john.doe@example.com', role: 'admin' },
      { name: 'Jane Smith', email: 'jane.smith@example.com', role: 'approval_manager' },
      { name: 'Bob Johnson', email: 'bob.johnson@example.com', role: 'user' },
      { name: 'Alice Brown', email: 'alice.brown@example.com', role: 'user' },
    ];
    
    for (const user of users) {
      await executeQuery(
        'INSERT INTO users (name, email, role) VALUES ($1, $2, $3) ON CONFLICT (email) DO NOTHING',
        [user.name, user.email, user.role]
      );
    }
    
    // Insert sample solutions
    const solutions = [
      {
        name: 'Enterprise Cloud Migration',
        description: 'Migrate legacy systems to AWS cloud infrastructure',
        customer: 'TechCorp Inc.',
        opportunity: 'Digital Transformation Initiative',
        estimatedValue: 500000,
        stage: 'draft',
      },
      {
        name: 'Cybersecurity Framework Implementation',
        description: 'Implement comprehensive security framework',
        customer: 'SecureBank Ltd.',
        opportunity: 'Security Enhancement Project',
        estimatedValue: 750000,
        stage: 'review',
      },
      {
        name: 'Data Analytics Platform',
        description: 'Build real-time analytics platform',
        customer: 'DataFlow Solutions',
        opportunity: 'Analytics Modernization',
        estimatedValue: 300000,
        stage: 'approved',
      },
    ];
    
    const adminUser = await executeQuery('SELECT id FROM users WHERE role = $1 LIMIT 1', ['admin']);
    const adminId = adminUser.records?.[0]?.[0]?.stringValue;
    
    for (const solution of solutions) {
      await executeQuery(
        `INSERT INTO solutions (
          name, description, customer, opportunity, estimated_value, 
          amount, currency, stage, owner_id, created_by, last_modified_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          solution.name,
          solution.description,
          solution.customer,
          solution.opportunity,
          solution.estimatedValue,
          solution.estimatedValue,
          'USD',
          solution.stage,
          adminId,
          adminId,
          adminId,
        ]
      );
    }
    
    // Insert sample approval workflows
    const workflows = [
      {
        name: 'High Value Approval',
        description: 'Required for solutions over $500k',
        isRequired: true,
        isActive: true,
      },
      {
        name: 'Security Review',
        description: 'Required for security-related solutions',
        isRequired: false,
        isActive: true,
      },
    ];
    
    for (const workflow of workflows) {
      const workflowResult = await executeQuery(
        `INSERT INTO approval_workflows (
          name, description, is_required, is_active, created_by
        ) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [
          workflow.name,
          workflow.description,
          workflow.isRequired,
          workflow.isActive,
          adminId,
        ]
      );
      
      const workflowId = workflowResult.records?.[0]?.[0]?.stringValue;
      
      if (workflowId) {
        // Add workflow steps
        const steps = [
          {
            name: 'Initial Review',
            description: 'Initial technical review',
            stepOrder: 1,
            requiresAllApprovers: false,
          },
          {
            name: 'Final Approval',
            description: 'Final management approval',
            stepOrder: 2,
            requiresAllApprovers: true,
          },
        ];
        
        for (const step of steps) {
          const stepResult = await executeQuery(
            `INSERT INTO workflow_steps (
              workflow_id, name, description, step_order, requires_all_approvers
            ) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [
              workflowId,
              step.name,
              step.description,
              step.stepOrder,
              step.requiresAllApprovers,
            ]
          );
          
          const stepId = stepResult.records?.[0]?.[0]?.stringValue;
          
          if (stepId) {
            // Add approvers to the step
            const approvers = await executeQuery(
              'SELECT id FROM users WHERE role IN ($1, $2)',
              ['admin', 'approval_manager']
            );
            
            for (const approver of approvers.records || []) {
              await executeQuery(
                'INSERT INTO workflow_step_approvers (step_id, approver_id) VALUES ($1, $2)',
                [stepId, approver[0].stringValue]
              );
            }
          }
        }
        
        // Add workflow rules
        if (workflow.name === 'High Value Approval') {
          await executeQuery(
            `INSERT INTO workflow_rules (
              workflow_id, field_name, operator, field_value, rule_order
            ) VALUES ($1, $2, $3, $4, $5)`,
            [workflowId, 'estimated_value', 'greater_than', '500000', 1]
          );
        }
      }
    }
    
    console.log('Sample data inserted successfully!');
  } catch (error) {
    console.error('Error inserting sample data:', error);
    throw error;
  }
}

// If this file is run directly, initialize the database
if (require.main === module) {
  initializeDatabase()
    .then(() => insertSampleData())
    .then(() => {
      console.log('Database setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database setup failed:', error);
      process.exit(1);
    });
} 