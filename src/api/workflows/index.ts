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
    const workflowId = pathParameters?.id;

    switch (httpMethod) {
      case 'GET':
        if (workflowId) {
          return await getWorkflow(workflowId, headers);
        } else {
          return await getWorkflows(headers);
        }

      case 'POST':
        return await createWorkflow(body, headers);

      case 'PUT':
        if (!workflowId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Workflow ID is required' }),
          };
        }
        return await updateWorkflow(workflowId, body, headers);

      case 'DELETE':
        if (!workflowId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Workflow ID is required' }),
          };
        }
        return await deleteWorkflow(workflowId, headers);

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

async function getWorkflows(headers: any): Promise<APIGatewayProxyResult> {
  try {
    const sql = `
      SELECT 
        w.*,
        u.name as created_by_name,
        u.email as created_by_email,
        COUNT(ws.id) as step_count,
        COUNT(wr.id) as rule_count
      FROM approval_workflows w
      LEFT JOIN users u ON w.created_by = u.id
      LEFT JOIN workflow_steps ws ON w.id = ws.workflow_id
      LEFT JOIN workflow_rules wr ON w.id = wr.workflow_id
      GROUP BY w.id, w.name, w.description, w.is_required, w.is_active, w.created_at, w.updated_at, w.created_by, u.name, u.email
      ORDER BY w.created_at DESC
    `;

    const workflows = await queryObjects(sql);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(workflows),
    };
  } catch (error) {
    console.error('Error getting workflows:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get workflows' }),
    };
  }
}

async function getWorkflow(workflowId: string, headers: any): Promise<APIGatewayProxyResult> {
  try {
    // Get workflow details
    const workflowSql = `
      SELECT 
        w.*,
        u.name as created_by_name,
        u.email as created_by_email
      FROM approval_workflows w
      LEFT JOIN users u ON w.created_by = u.id
      WHERE w.id = $1
    `;

    const workflow = await querySingle(workflowSql, [workflowId]);

    if (!workflow) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Workflow not found' }),
      };
    }

    // Get workflow steps
    const stepsSql = `
      SELECT 
        ws.*,
        array_agg(u.name) as approver_names,
        array_agg(u.email) as approver_emails
      FROM workflow_steps ws
      LEFT JOIN workflow_step_approvers wsa ON ws.id = wsa.step_id
      LEFT JOIN users u ON wsa.approver_id = u.id
      WHERE ws.workflow_id = $1
      GROUP BY ws.id, ws.name, ws.description, ws.step_order, ws.requires_all_approvers, ws.created_at
      ORDER BY ws.step_order
    `;

    const steps = await queryObjects(stepsSql, [workflowId]);

    // Get workflow rules
    const rulesSql = `
      SELECT * FROM workflow_rules 
      WHERE workflow_id = $1 
      ORDER BY rule_order
    `;

    const rules = await queryObjects(rulesSql, [workflowId]);

    const result = {
      ...workflow,
      steps,
      rules,
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Error getting workflow:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to get workflow' }),
    };
  }
}

async function createWorkflow(body: string | null, headers: any): Promise<APIGatewayProxyResult> {
  try {
    if (!body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const workflowData = JSON.parse(body);
    
    // Get default admin user for now (in real app, get from auth context)
    const adminUser = await querySingle('SELECT id FROM users WHERE role = $1 LIMIT 1', ['admin']);

    const sql = `
      INSERT INTO approval_workflows (
        name, description, is_required, is_active, created_by
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const parameters = [
      workflowData.name,
      workflowData.description || '',
      workflowData.isRequired || false,
      workflowData.isActive !== false, // Default to true
      adminUser?.id,
    ];

    const newWorkflow = await querySingle(sql, parameters);

    // Create steps if provided
    if (workflowData.steps && Array.isArray(workflowData.steps)) {
      for (const step of workflowData.steps) {
        const stepSql = `
          INSERT INTO workflow_steps (
            workflow_id, name, description, step_order, requires_all_approvers
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `;

        const stepResult = await querySingle(stepSql, [
          newWorkflow.id,
          step.name,
          step.description || '',
          step.stepOrder,
          step.requiresAllApprovers || false,
        ]);

        // Create step approvers if provided
        if (step.approvers && Array.isArray(step.approvers)) {
          for (const approverId of step.approvers) {
            await executeQuery(
              'INSERT INTO workflow_step_approvers (step_id, approver_id) VALUES ($1, $2)',
              [stepResult.id, approverId]
            );
          }
        }
      }
    }

    // Create rules if provided
    if (workflowData.rules && Array.isArray(workflowData.rules)) {
      for (const rule of workflowData.rules) {
        await executeQuery(
          'INSERT INTO workflow_rules (workflow_id, field_name, operator, field_value, rule_order) VALUES ($1, $2, $3, $4, $5)',
          [
            newWorkflow.id,
            rule.fieldName,
            rule.operator,
            rule.fieldValue,
            rule.ruleOrder,
          ]
        );
      }
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify(newWorkflow),
    };
  } catch (error) {
    console.error('Error creating workflow:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create workflow' }),
    };
  }
}

async function updateWorkflow(workflowId: string, body: string | null, headers: any): Promise<APIGatewayProxyResult> {
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
      UPDATE approval_workflows 
      SET 
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        is_required = COALESCE($4, is_required),
        is_active = COALESCE($5, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const parameters = [
      workflowId,
      updateData.name,
      updateData.description,
      updateData.isRequired,
      updateData.isActive,
    ];

    const updatedWorkflow = await querySingle(sql, parameters);

    if (!updatedWorkflow) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Workflow not found' }),
      };
    }

    // Update steps if provided
    if (updateData.steps && Array.isArray(updateData.steps)) {
      // Delete existing steps
      await executeQuery('DELETE FROM workflow_steps WHERE workflow_id = $1', [workflowId]);

      // Create new steps
      for (const step of updateData.steps) {
        const stepSql = `
          INSERT INTO workflow_steps (
            workflow_id, name, description, step_order, requires_all_approvers
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING id
        `;

        const stepResult = await querySingle(stepSql, [
          workflowId,
          step.name,
          step.description || '',
          step.stepOrder,
          step.requiresAllApprovers || false,
        ]);

        // Create step approvers if provided
        if (step.approvers && Array.isArray(step.approvers)) {
          for (const approverId of step.approvers) {
            await executeQuery(
              'INSERT INTO workflow_step_approvers (step_id, approver_id) VALUES ($1, $2)',
              [stepResult.id, approverId]
            );
          }
        }
      }
    }

    // Update rules if provided
    if (updateData.rules && Array.isArray(updateData.rules)) {
      // Delete existing rules
      await executeQuery('DELETE FROM workflow_rules WHERE workflow_id = $1', [workflowId]);

      // Create new rules
      for (const rule of updateData.rules) {
        await executeQuery(
          'INSERT INTO workflow_rules (workflow_id, field_name, operator, field_value, rule_order) VALUES ($1, $2, $3, $4, $5)',
          [
            workflowId,
            rule.fieldName,
            rule.operator,
            rule.fieldValue,
            rule.ruleOrder,
          ]
        );
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updatedWorkflow),
    };
  } catch (error) {
    console.error('Error updating workflow:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to update workflow' }),
    };
  }
}

async function deleteWorkflow(workflowId: string, headers: any): Promise<APIGatewayProxyResult> {
  try {
    // Check if workflow exists
    const existingWorkflow = await querySingle('SELECT id FROM approval_workflows WHERE id = $1', [workflowId]);
    
    if (!existingWorkflow) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Workflow not found' }),
      };
    }

    // Delete related records first (steps, rules, etc.)
    await executeQuery('DELETE FROM workflow_step_approvers WHERE step_id IN (SELECT id FROM workflow_steps WHERE workflow_id = $1)', [workflowId]);
    await executeQuery('DELETE FROM workflow_steps WHERE workflow_id = $1', [workflowId]);
    await executeQuery('DELETE FROM workflow_rules WHERE workflow_id = $1', [workflowId]);
    
    // Delete the workflow
    await executeQuery('DELETE FROM approval_workflows WHERE id = $1', [workflowId]);

    return {
      statusCode: 204,
      headers,
      body: '',
    };
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to delete workflow' }),
    };
  }
} 