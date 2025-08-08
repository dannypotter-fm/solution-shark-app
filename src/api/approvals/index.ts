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
    const approvalId = pathParameters?.id;

    switch (httpMethod) {
      case 'GET':
        if (approvalId) {
          return await getApproval(approvalId, headers);
        } else {
          return await getApprovals(headers);
        }

      case 'POST':
        return await createApproval(body, headers);

      case 'PUT':
        if (!approvalId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Approval ID is required' }),
          };
        }
        return await updateApproval(approvalId, body, headers);

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

async function getApprovals(headers: any): Promise<APIGatewayProxyResult> {
  try {
    const sql = `
      SELECT 
        a.id,
        a.solution_id,
        s.name as solution_name,
        w.name as workflow_name,
        a.status,
        a.priority,
        a.submitted_at,
        a.processed_at,
        a.current_step_order,
        a.total_steps,
        u.name as requester_name,
        u.email as requester_email,
        p.name as processed_by_name
      FROM approvals a
      JOIN solutions s ON a.solution_id = s.id
      JOIN approval_workflows w ON a.workflow_id = w.id
      JOIN users u ON a.requester_id = u.id
      LEFT JOIN users p ON a.processed_by = p.id
      ORDER BY a.submitted_at DESC
    `;

    const approvals = await queryObjects(sql);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(approvals),
    };
  } catch (error) {
    console.error('Error getting approvals:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get approvals' }),
    };
  }
}

async function getApproval(approvalId: string, headers: any): Promise<APIGatewayProxyResult> {
  try {
    const sql = `
      SELECT 
        a.*,
        s.name as solution_name,
        w.name as workflow_name,
        u.name as requester_name,
        u.email as requester_email,
        p.name as processed_by_name
      FROM approvals a
      JOIN solutions s ON a.solution_id = s.id
      JOIN approval_workflows w ON a.workflow_id = w.id
      JOIN users u ON a.requester_id = u.id
      LEFT JOIN users p ON a.processed_by = p.id
      WHERE a.id = $1
    `;

    const approval = await querySingle(sql, [approvalId]);

    if (!approval) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Approval not found' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(approval),
    };
  } catch (error) {
    console.error('Error getting approval:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get approval' }),
    };
  }
}

async function createApproval(body: string | null, headers: any): Promise<APIGatewayProxyResult> {
  try {
    if (!body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const approvalData = JSON.parse(body);
    
    // Get default admin user for now (in real app, get from auth context)
    const adminUser = await querySingle('SELECT id FROM users WHERE role = $1 LIMIT 1', ['admin']);
    
    // Generate unique ID with timestamp and random string to ensure uniqueness
    const timestamp = Date.now();
    const processId = process.pid || Math.floor(Math.random() * 10000);
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    const id = `approval_${timestamp}_${processId}_${randomSuffix}`;

    const sql = `
      INSERT INTO approvals (
        id, solution_id, workflow_id, requester_id, status, priority, 
        current_step_order, total_steps, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const parameters = [
      id,
      approvalData.solutionId,
      approvalData.workflowId,
      adminUser?.id || approvalData.requesterId,
      approvalData.status || 'pending',
      approvalData.priority || 'medium',
      approvalData.currentStepOrder || 1,
      approvalData.totalSteps || 1,
      approvalData.notes || '',
    ];

    const newApproval = await querySingle(sql, parameters);

    // Update solution stage to 'review' if not already
    if (approvalData.solutionId) {
      await executeQuery(
        'UPDATE solutions SET stage = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND stage != $1',
        ['review', approvalData.solutionId]
      );
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(newApproval),
    };
  } catch (error) {
    console.error('Error creating approval:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create approval' }),
    };
  }
}

async function updateApproval(approvalId: string, body: string | null, headers: any): Promise<APIGatewayProxyResult> {
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
      UPDATE approvals 
      SET 
        status = COALESCE($2, status),
        current_step_order = COALESCE($3, current_step_order),
        total_steps = COALESCE($4, total_steps),
        priority = COALESCE($5, priority),
        notes = COALESCE($6, notes),
        processed_by = $7,
        processed_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const parameters = [
      approvalId,
      updateData.status,
      updateData.currentStepOrder,
      updateData.totalSteps,
      updateData.priority,
      updateData.notes,
      adminUser?.id,
    ];

    const updatedApproval = await querySingle(sql, parameters);

    if (!updatedApproval) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Approval not found' }),
      };
    }

    // Update solution stage based on approval status
    if (updateData.status === 'approved') {
      // Check if all approvals for this solution are approved
      const allApprovalsApproved = await querySingle(
        'SELECT COUNT(*) as total, COUNT(CASE WHEN status = $1 THEN 1 END) as approved FROM approvals WHERE solution_id = $2',
        ['approved', updatedApproval.solution_id]
      );

      if (allApprovalsApproved && allApprovalsApproved.total === allApprovalsApproved.approved) {
        await executeQuery(
          'UPDATE solutions SET stage = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['approved', updatedApproval.solution_id]
        );
      }
    } else if (updateData.status === 'rejected') {
      // Reset solution to draft if any approval is rejected
      await executeQuery(
        'UPDATE solutions SET stage = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['draft', updatedApproval.solution_id]
      );
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updatedApproval),
    };
  } catch (error) {
    console.error('Error updating approval:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to update approval' }),
    };
  }
} 