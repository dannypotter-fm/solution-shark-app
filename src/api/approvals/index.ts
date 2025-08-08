import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { logger } from '@aws-lambda-powertools/logger';

const logger = new logger({ serviceName: process.env.POWERTOOLS_SERVICE_NAME || 'approvals-api' });

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const APPROVALS_TABLE = process.env.APPROVALS_TABLE!;
const SOLUTIONS_TABLE = process.env.SOLUTIONS_TABLE!;

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
          return await getApproval(pathParameters.id);
        } else {
          return await listApprovals();
        }

      case 'POST':
        return await createApproval(body);

      case 'PUT':
        if (pathParameters?.id) {
          return await updateApproval(pathParameters.id, body);
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

async function getApproval(id: string): Promise<APIGatewayProxyResult> {
  try {
    const command = new GetCommand({
      TableName: APPROVALS_TABLE,
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
        body: JSON.stringify({ error: 'Approval not found' }),
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
    logger.error('Error getting approval', { error, id });
    throw error;
  }
}

async function listApprovals(): Promise<APIGatewayProxyResult> {
  try {
    const command = new ScanCommand({
      TableName: APPROVALS_TABLE,
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
    logger.error('Error listing approvals', { error });
    throw error;
  }
}

async function createApproval(body: string | null): Promise<APIGatewayProxyResult> {
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

    const approvalData = JSON.parse(body);
    // Generate unique ID with timestamp, random string, and process ID to ensure uniqueness
    // This prevents conflicts when multiple approvals are created simultaneously
    const timestamp = Date.now()
    const processId = process.pid || Math.floor(Math.random() * 10000)
    const randomSuffix = Math.random().toString(36).substr(2, 9)
    const id = `approval_${timestamp}_${processId}_${randomSuffix}`
    const now = new Date().toISOString();

    const approval = {
      id,
      ...approvalData,
      submittedAt: now,
      status: 'pending',
    };

    const command = new PutCommand({
      TableName: APPROVALS_TABLE,
      Item: approval,
    });

    await docClient.send(command);

    // Update solution stage to 'review' if not already
    if (approval.solutionId) {
      await updateSolutionStage(approval.solutionId, 'review');
    }

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(approval),
    };
  } catch (error) {
    logger.error('Error creating approval', { error });
    throw error;
  }
}

async function updateApproval(id: string, body: string | null): Promise<APIGatewayProxyResult> {
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

    // First, get the existing approval
    const getCommand = new GetCommand({
      TableName: APPROVALS_TABLE,
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
        body: JSON.stringify({ error: 'Approval not found' }),
      };
    }

    const updatedApproval = {
      ...existingResult.Item,
      ...updateData,
      processedAt: now,
    };

    const putCommand = new PutCommand({
      TableName: APPROVALS_TABLE,
      Item: updatedApproval,
    });

    await docClient.send(putCommand);

    // Update solution stage based on approval status
    if (updatedApproval.solutionId && updatedApproval.status) {
      if (updatedApproval.status === 'approved') {
        await updateSolutionStage(updatedApproval.solutionId, 'approved');
      } else if (updatedApproval.status === 'rejected') {
        await updateSolutionStage(updatedApproval.solutionId, 'draft');
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(updatedApproval),
    };
  } catch (error) {
    logger.error('Error updating approval', { error, id });
    throw error;
  }
}

async function updateSolutionStage(solutionId: string, stage: string): Promise<void> {
  try {
    const getCommand = new GetCommand({
      TableName: SOLUTIONS_TABLE,
      Key: { id: solutionId },
    });

    const existingResult = await docClient.send(getCommand);

    if (existingResult.Item) {
      const updatedSolution = {
        ...existingResult.Item,
        stage,
        updatedAt: new Date().toISOString(),
      };

      const putCommand = new PutCommand({
        TableName: SOLUTIONS_TABLE,
        Item: updatedSolution,
      });

      await docClient.send(putCommand);
    }
  } catch (error) {
    logger.error('Error updating solution stage', { error, solutionId, stage });
    // Don't throw here as this is a side effect
  }
} 