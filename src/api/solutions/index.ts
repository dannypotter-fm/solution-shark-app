import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { queryObjects, querySingle, executeQuery } from '../../database/connection';

const SOLUTIONS_TABLE = process.env.SOLUTIONS_TABLE!;
const APPROVALS_TABLE = process.env.APPROVALS_TABLE!;
const WORKFLOWS_TABLE = process.env.WORKFLOWS_TABLE!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  };

  try {
    const { httpMethod, pathParameters, body } = event;
    const solutionId = pathParameters?.id;

    switch (httpMethod) {
      case 'GET':
        if (solutionId) {
          return await getSolution(solutionId, headers);
        } else {
          return await getSolutions(headers);
        }

      case 'POST':
        return await createSolution(body, headers);

      case 'PUT':
        if (!solutionId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Solution ID is required' }),
          };
        }
        return await updateSolution(solutionId, body, headers);

      case 'DELETE':
        if (!solutionId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Solution ID is required' }),
          };
        }
        return await deleteSolution(solutionId, headers);

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

async function getSolutions(headers: any): Promise<APIGatewayProxyResult> {
  try {
    const sql = `
      SELECT 
        s.id,
        s.name,
        s.description,
        s.customer,
        s.opportunity,
        s.estimated_value,
        s.amount,
        s.currency,
        s.stage,
        s.project_type,
        s.created_at,
        s.updated_at,
        u.name as owner_name,
        u.email as owner_email,
        COUNT(a.id) as approval_count,
        COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending_approvals
      FROM solutions s
      LEFT JOIN users u ON s.owner_id = u.id
      LEFT JOIN approvals a ON s.id = a.solution_id
      GROUP BY s.id, s.name, s.description, s.customer, s.opportunity, s.estimated_value, s.amount, s.currency, s.stage, s.project_type, s.created_at, s.updated_at, u.name, u.email
      ORDER BY s.created_at DESC
    `;

    const solutions = await queryObjects(sql);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(solutions),
    };
  } catch (error) {
    console.error('Error getting solutions:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get solutions' }),
    };
  }
}

async function getSolution(solutionId: string, headers: any): Promise<APIGatewayProxyResult> {
  try {
    const sql = `
      SELECT 
        s.*,
        u.name as owner_name,
        u.email as owner_email,
        COUNT(a.id) as approval_count,
        COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending_approvals
      FROM solutions s
      LEFT JOIN users u ON s.owner_id = u.id
      LEFT JOIN approvals a ON s.id = a.solution_id
      WHERE s.id = $1
      GROUP BY s.id, s.name, s.description, s.customer, s.opportunity, s.estimated_value, s.amount, s.currency, s.stage, s.project_type, s.created_at, s.updated_at, s.owner_id, s.created_by, s.last_modified_by, u.name, u.email
    `;

    const solution = await querySingle(sql, [solutionId]);

    if (!solution) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Solution not found' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(solution),
    };
  } catch (error) {
    console.error('Error getting solution:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get solution' }),
    };
  }
}

async function createSolution(body: string | null, headers: any): Promise<APIGatewayProxyResult> {
  try {
    if (!body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const solutionData = JSON.parse(body);
    
    // Get default admin user for now (in real app, get from auth context)
    const adminUser = await querySingle('SELECT id FROM users WHERE role = $1 LIMIT 1', ['admin']);
    
    const sql = `
      INSERT INTO solutions (
        name, description, customer, opportunity, estimated_value, amount, currency, 
        stage, owner_id, project_type, created_by, last_modified_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const parameters = [
      solutionData.name,
      solutionData.description || '',
      solutionData.customer || '',
      solutionData.opportunity || '',
      solutionData.estimatedValue || 0,
      solutionData.amount || solutionData.estimatedValue || 0,
      solutionData.currency || 'USD',
      solutionData.stage || 'draft',
      adminUser?.id || solutionData.ownerId,
      solutionData.projectType || '',
      adminUser?.id,
      adminUser?.id,
    ];

    const newSolution = await querySingle(sql, parameters);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(newSolution),
    };
  } catch (error) {
    console.error('Error creating solution:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create solution' }),
    };
  }
}

async function updateSolution(solutionId: string, body: string | null, headers: any): Promise<APIGatewayProxyResult> {
  try {
    if (!body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const updateData = JSON.parse(body);
    
    // Get default admin user for now (in real app, get from auth context)
    const adminUser = await querySingle('SELECT id FROM users WHERE role = $1 LIMIT 1', ['admin']);

    const sql = `
      UPDATE solutions 
      SET 
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        customer = COALESCE($4, customer),
        opportunity = COALESCE($5, opportunity),
        estimated_value = COALESCE($6, estimated_value),
        amount = COALESCE($7, amount),
        currency = COALESCE($8, currency),
        stage = COALESCE($9, stage),
        project_type = COALESCE($10, project_type),
        last_modified_by = $11,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const parameters = [
      solutionId,
      updateData.name,
      updateData.description,
      updateData.customer,
      updateData.opportunity,
      updateData.estimatedValue,
      updateData.amount,
      updateData.currency,
      updateData.stage,
      updateData.projectType,
      adminUser?.id,
    ];

    const updatedSolution = await querySingle(sql, parameters);

    if (!updatedSolution) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Solution not found' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updatedSolution),
    };
  } catch (error) {
    console.error('Error updating solution:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to update solution' }),
    };
  }
}

async function deleteSolution(solutionId: string, headers: any): Promise<APIGatewayProxyResult> {
  try {
    // Check if solution exists
    const existingSolution = await querySingle('SELECT id FROM solutions WHERE id = $1', [solutionId]);
    
    if (!existingSolution) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Solution not found' }),
      };
    }

    // Delete related records first (approvals, etc.)
    await executeQuery('DELETE FROM approvals WHERE solution_id = $1', [solutionId]);
    
    // Delete the solution
    await executeQuery('DELETE FROM solutions WHERE id = $1', [solutionId]);

    return {
      statusCode: 204,
      headers,
      body: '',
    };
  } catch (error) {
    console.error('Error deleting solution:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to delete solution' }),
    };
  }
} 