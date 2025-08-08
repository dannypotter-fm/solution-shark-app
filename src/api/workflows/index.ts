import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { logger } from '@aws-lambda-powertools/logger';

const logger = new logger({ serviceName: process.env.POWERTOOLS_SERVICE_NAME || 'workflows-api' });

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const WORKFLOWS_TABLE = process.env.WORKFLOWS_TABLE!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Processing request', { 
      method: event.httpMethod, 
      path: event.path,
      resource: event.resource 
    });

    const { httpMethod, pathParameters, body } = event;

    switch (httpMethod) {
      case 'GET':
        if (pathParameters?.id) {
          return await getWorkflow(pathParameters.id);
        } else {
          return await listWorkflows();
        }

      case 'POST':
        return await createWorkflow(body);

      case 'PUT':
        if (pathParameters?.id) {
          return await updateWorkflow(pathParameters.id, body);
        }
        break;

      case 'DELETE':
        if (pathParameters?.id) {
          return await deleteWorkflow(pathParameters.id);
        }
        break;
    }

    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      },
      body: JSON.stringify({ error: 'Invalid request' }),
    };

  } catch (error) {
    logger.error('Error processing request', { error });
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

async function getWorkflow(id: string): Promise<APIGatewayProxyResult> {
  try {
    const command = new GetCommand({
      TableName: WORKFLOWS_TABLE,
      Key: { id },
    });

    const result = await docClient.send(command);

    if (!result.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Workflow not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result.Item),
    };
  } catch (error) {
    logger.error('Error getting workflow', { error, id });
    throw error;
  }
}

async function listWorkflows(): Promise<APIGatewayProxyResult> {
  try {
    const command = new ScanCommand({
      TableName: WORKFLOWS_TABLE,
    });

    const result = await docClient.send(command);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(result.Items || []),
    };
  } catch (error) {
    logger.error('Error listing workflows', { error });
    throw error;
  }
}

async function createWorkflow(body: string | null): Promise<APIGatewayProxyResult> {
  try {
    if (!body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const workflowData = JSON.parse(body);
    const id = `workflow_${Date.now()}`;
    const now = new Date().toISOString();

    const workflow = {
      id,
      ...workflowData,
      createdAt: now,
      updatedAt: now,
      isActive: true,
    };

    const command = new PutCommand({
      TableName: WORKFLOWS_TABLE,
      Item: workflow,
    });

    await docClient.send(command);

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(workflow),
    };
  } catch (error) {
    logger.error('Error creating workflow', { error });
    throw error;
  }
}

async function updateWorkflow(id: string, body: string | null): Promise<APIGatewayProxyResult> {
  try {
    if (!body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const updateData = JSON.parse(body);
    const now = new Date().toISOString();

    // First, get the existing workflow
    const getCommand = new GetCommand({
      TableName: WORKFLOWS_TABLE,
      Key: { id },
    });

    const existingResult = await docClient.send(getCommand);

    if (!existingResult.Item) {
      return {
        statusCode: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Workflow not found' }),
      };
    }

    const updatedWorkflow = {
      ...existingResult.Item,
      ...updateData,
      updatedAt: now,
    };

    const putCommand = new PutCommand({
      TableName: WORKFLOWS_TABLE,
      Item: updatedWorkflow,
    });

    await docClient.send(putCommand);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(updatedWorkflow),
    };
  } catch (error) {
    logger.error('Error updating workflow', { error, id });
    throw error;
  }
}

async function deleteWorkflow(id: string): Promise<APIGatewayProxyResult> {
  try {
    const command = new DeleteCommand({
      TableName: WORKFLOWS_TABLE,
      Key: { id },
    });

    await docClient.send(command);

    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      body: '',
    };
  } catch (error) {
    logger.error('Error deleting workflow', { error, id });
    throw error;
  }
} 