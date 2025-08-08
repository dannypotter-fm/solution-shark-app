import { RDSDataService } from '@aws-sdk/client-rds-data';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

// Database connection configuration
const rdsDataService = new RDSDataService({
  region: process.env.AWS_REGION || 'us-east-1',
});

const secretsManager = new SecretsManagerClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

interface DatabaseCredentials {
  username: string;
  password: string;
}

interface QueryResult {
  records: any[];
  columnMetadata?: any[];
}

/**
 * Get database credentials from AWS Secrets Manager
 */
async function getDatabaseCredentials(): Promise<DatabaseCredentials> {
  try {
    const command = new GetSecretValueCommand({
      SecretId: process.env.DB_SECRET_ARN!,
    });
    
    const response = await secretsManager.send(command);
    const secretString = response.SecretString;
    
    if (!secretString) {
      throw new Error('No secret string found');
    }
    
    const credentials = JSON.parse(secretString);
    return {
      username: credentials.username,
      password: credentials.password,
    };
  } catch (error) {
    console.error('Error getting database credentials:', error);
    throw error;
  }
}

/**
 * Execute a SQL query using AWS RDS Data API
 */
export async function executeQuery(
  sql: string,
  parameters: any[] = []
): Promise<QueryResult> {
  try {
    const credentials = await getDatabaseCredentials();
    
    const paramSets = parameters.map((param, index) => ({
      name: `param${index + 1}`,
      value: {
        stringValue: typeof param === 'string' ? param : JSON.stringify(param),
      },
    }));

    const response = await rdsDataService.executeStatement({
      resourceArn: process.env.DB_CLUSTER_ARN!,
      secretArn: process.env.DB_SECRET_ARN!,
      database: process.env.DB_NAME || 'solution_shark',
      sql,
      parameters: paramSets,
      includeResultMetadata: true,
    });

    return {
      records: response.records || [],
      columnMetadata: response.columnMetadata,
    };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Execute a transaction with multiple SQL statements
 */
export async function executeTransaction(
  statements: { sql: string; parameters?: any[] }[]
): Promise<void> {
  try {
    const credentials = await getDatabaseCredentials();
    
    const transactionStatements = statements.map(({ sql, parameters = [] }) => ({
      sql,
      parameters: parameters.map((param, index) => ({
        name: `param${index + 1}`,
        value: {
          stringValue: typeof param === 'string' ? param : JSON.stringify(param),
        },
      })),
    }));

    await rdsDataService.beginTransaction({
      resourceArn: process.env.DB_CLUSTER_ARN!,
      secretArn: process.env.DB_SECRET_ARN!,
      database: process.env.DB_NAME || 'solution_shark',
    });

    for (const statement of transactionStatements) {
      await rdsDataService.executeStatement({
        resourceArn: process.env.DB_CLUSTER_ARN!,
        secretArn: process.env.DB_SECRET_ARN!,
        database: process.env.DB_NAME || 'solution_shark',
        sql: statement.sql,
        parameters: statement.parameters,
      });
    }

    await rdsDataService.commitTransaction({
      resourceArn: process.env.DB_CLUSTER_ARN!,
      secretArn: process.env.DB_SECRET_ARN!,
      transactionId: '', // This would be returned from beginTransaction
    });
  } catch (error) {
    console.error('Transaction error:', error);
    // Attempt to rollback
    try {
      await rdsDataService.rollbackTransaction({
        resourceArn: process.env.DB_CLUSTER_ARN!,
        secretArn: process.env.DB_SECRET_ARN!,
        transactionId: '', // This would be returned from beginTransaction
      });
    } catch (rollbackError) {
      console.error('Rollback error:', rollbackError);
    }
    throw error;
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
      const columnName = columnMetadata[index].name;
      obj[columnName] = field.stringValue || field.longValue || field.doubleValue || field.booleanValue || field.isNull ? null : field.stringValue;
    });
    return obj;
  });
}

/**
 * Helper function to execute a query and return objects
 */
export async function queryObjects(sql: string, parameters: any[] = []): Promise<any[]> {
  const result = await executeQuery(sql, parameters);
  return convertRecordsToObjects(result.records, result.columnMetadata || []);
}

/**
 * Helper function to execute a query and return a single object
 */
export async function querySingle(sql: string, parameters: any[] = []): Promise<any | null> {
  const objects = await queryObjects(sql, parameters);
  return objects.length > 0 ? objects[0] : null;
}

/**
 * Helper function to execute a query and return count
 */
export async function queryCount(sql: string, parameters: any[] = []): Promise<number> {
  const result = await executeQuery(sql, parameters);
  if (result.records && result.records.length > 0) {
    const countField = result.records[0][0];
    return parseInt(countField.longValue || countField.stringValue || '0');
  }
  return 0;
} 