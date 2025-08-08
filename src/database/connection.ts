// Database connection configuration for local development
// In production, this would use AWS RDS Data API

interface DatabaseCredentials {
  username: string;
  password: string;
}

interface QueryResult {
  records: any[];
  columnMetadata?: any[];
}

// Mock database for local development
const mockDatabase = {
  solutions: [
    {
      id: '1',
      name: 'Enterprise Cloud Migration',
      description: 'Comprehensive cloud migration strategy for enterprise infrastructure.',
      customer: 'TechCorp Inc.',
      opportunity: 'Cloud Infrastructure Upgrade',
      estimatedValue: 250000,
      amount: 250000,
      currency: 'USD',
      stage: 'draft',
      ownerId: 'user1',
      projectType: 'Implementation',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
      createdBy: 'admin@example.com',
      lastModifiedBy: 'admin@example.com'
    },
    {
      id: '2',
      name: 'Digital Transformation Platform',
      description: 'End-to-end digital transformation solution for retail operations.',
      customer: 'Global Retail Ltd.',
      opportunity: 'Digital Innovation Initiative',
      estimatedValue: 500000,
      amount: 500000,
      currency: 'GBP',
      stage: 'review',
      ownerId: 'user2',
      projectType: 'Consulting',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-18'),
      createdBy: 'admin@example.com',
      lastModifiedBy: 'admin@example.com'
    }
  ],
  approvals: [] as any[],
  workflows: [
    {
      id: '1',
      name: 'Enterprise Solution Approval',
      description: 'Standard approval workflow for enterprise-level solutions',
      isRequired: true,
      isActive: true,
      isArchived: false,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
      createdBy: 'admin@example.com',
      steps: [
        {
          id: 'step1',
          name: 'Technical Review',
          type: 'technical_review',
          description: 'Technical feasibility assessment',
          order: 1,
          isRequired: true,
          assignedApprovers: ['user1'],
          requireAllApprovers: true
        }
      ],
      rules: [],
      conditionRules: [],
      notifications: ['email', 'in_app']
    }
  ],
  users: [
    {
      id: 'user1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'admin'
    }
  ]
};

let nextId = 3; // For generating new IDs

/**
 * Execute a SQL query (mock implementation for local development)
 */
export async function executeQuery(
  sql: string,
  parameters: any[] = []
): Promise<QueryResult> {
  console.log('Mock executeQuery:', sql, parameters);
  
  // Parse SQL to determine operation
  const sqlLower = sql.toLowerCase();
  
  if (sqlLower.includes('select') && sqlLower.includes('solutions')) {
    return {
      records: mockDatabase.solutions.map(s => [s]),
      columnMetadata: []
    };
  }
  
  if (sqlLower.includes('select') && sqlLower.includes('users')) {
    return {
      records: mockDatabase.users.map(u => [u]),
      columnMetadata: []
    };
  }
  
  if (sqlLower.includes('select') && sqlLower.includes('approval_workflows')) {
    return {
      records: mockDatabase.workflows.map(w => [w]),
      columnMetadata: []
    };
  }
  
  if (sqlLower.includes('insert') && sqlLower.includes('solutions')) {
    const newSolution = {
      id: nextId.toString(),
      name: parameters[0] || 'New Solution',
      description: parameters[1] || '',
      customer: parameters[2] || '',
      opportunity: parameters[3] || '',
      estimatedValue: parameters[4] || 0,
      amount: parameters[5] || 0,
      currency: parameters[6] || 'USD',
      stage: parameters[7] || 'draft',
      ownerId: parameters[8] || 'user1',
      projectType: parameters[9] || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: parameters[10] || 'admin@example.com',
      lastModifiedBy: parameters[11] || 'admin@example.com'
    };
    
    mockDatabase.solutions.push(newSolution);
    nextId++;
    
    return {
      records: [[newSolution]],
      columnMetadata: []
    };
  }
  
  if (sqlLower.includes('insert') && sqlLower.includes('approvals')) {
    const newApproval = {
      id: `approval_${Date.now()}`,
      solutionId: parameters[0],
      workflowId: parameters[1],
      requesterId: parameters[2],
      status: parameters[3] || 'pending',
      currentStepOrder: parameters[4] || 1,
      totalSteps: parameters[5] || 1,
      priority: parameters[6] || 'medium',
      notes: parameters[7] || ''
    };
    
    mockDatabase.approvals.push(newApproval);
    
    return {
      records: [[newApproval]],
      columnMetadata: []
    };
  }
  
  if (sqlLower.includes('update') && sqlLower.includes('solutions')) {
    const solutionId = parameters[0];
    const solution = mockDatabase.solutions.find(s => s.id === solutionId);
    
    if (solution) {
      Object.assign(solution, {
        name: parameters[1] || solution.name,
        description: parameters[2] || solution.description,
        customer: parameters[3] || solution.customer,
        opportunity: parameters[4] || solution.opportunity,
        estimatedValue: parameters[5] || solution.estimatedValue,
        amount: parameters[6] || solution.amount,
        currency: parameters[7] || solution.currency,
        stage: parameters[8] || solution.stage,
        projectType: parameters[9] || solution.projectType,
        updatedAt: new Date()
      });
      
      return {
        records: [[solution]],
        columnMetadata: []
      };
    }
  }
  
  if (sqlLower.includes('delete') && sqlLower.includes('solutions')) {
    const solutionId = parameters[0];
    const index = mockDatabase.solutions.findIndex(s => s.id === solutionId);
    
    if (index !== -1) {
      mockDatabase.solutions.splice(index, 1);
    }
    
    return {
      records: [],
      columnMetadata: []
    };
  }
  
  return {
    records: [],
    columnMetadata: []
  };
}

/**
 * Execute a query and return objects
 */
export async function queryObjects(sql: string, parameters: any[] = []): Promise<any[]> {
  const result = await executeQuery(sql, parameters);
  return result.records.map(record => record[0]).filter(Boolean);
}

/**
 * Execute a query and return a single object
 */
export async function querySingle(sql: string, parameters: any[] = []): Promise<any | null> {
  const objects = await queryObjects(sql, parameters);
  return objects.length > 0 ? objects[0] : null;
}

/**
 * Execute a query and return count
 */
export async function queryCount(sql: string, parameters: any[] = []): Promise<number> {
  const result = await executeQuery(sql, parameters);
  return result.records.length;
}

/**
 * Execute a transaction with multiple SQL statements
 */
export async function executeTransaction(
  statements: { sql: string; parameters?: any[] }[]
): Promise<void> {
  for (const statement of statements) {
    await executeQuery(statement.sql, statement.parameters || []);
  }
}

/**
 * Convert RDS Data API records to plain objects
 */
export function convertRecordsToObjects(records: any[], columnMetadata: any[]): any[] {
  if (!records || !columnMetadata) return [];
  
  return records.map(record => {
    const obj: any = {};
    record.forEach((field: any, index: number) => {
      const columnName = columnMetadata[index]?.name || `column${index}`;
      obj[columnName] = field.stringValue || field.longValue || field.doubleValue || field.booleanValue || field.isNull ? null : field.stringValue;
    });
    return obj;
  });
} 