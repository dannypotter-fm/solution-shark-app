import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { logger } from '@aws-lambda-powertools/logger';

const logger = new logger({ serviceName: process.env.POWERTOOLS_SERVICE_NAME || 'solutions-api' });

const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);

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
          return await getSolution(pathParameters.id);
        } else {
          return await listSolutions();
        }

      case 'POST':
        return await createSolution(body);

      case 'PUT':
        if (pathParameters?.id) {
          return await updateSolution(pathParameters.id, body);
        }
        break;

      case 'DELETE':
        if (pathParameters?.id) {
          return await deleteSolution(pathParameters.id);
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

async function getSolution(id: string): Promise<APIGatewayProxyResult> {
  try {
    const command = new GetCommand({
      TableName: SOLUTIONS_TABLE,
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
        body: JSON.stringify({ error: 'Solution not found' }),
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
    logger.error('Error getting solution', { error, id });
    throw error;
  }
}

async function listSolutions(): Promise<APIGatewayProxyResult> {
  try {
    const command = new ScanCommand({
      TableName: SOLUTIONS_TABLE,
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
    logger.error('Error listing solutions', { error });
    throw error;
  }
}

async function createSolution(body: string | null): Promise<APIGatewayProxyResult> {
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

    const solutionData = JSON.parse(body);
    const id = Date.now().toString();
    const now = new Date().toISOString();

    const solution = {
      id,
      ...solutionData,
      createdAt: now,
      updatedAt: now,
    };

    const command = new PutCommand({
      TableName: SOLUTIONS_TABLE,
      Item: solution,
    });

    await docClient.send(command);

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(solution),
    };
  } catch (error) {
    logger.error('Error creating solution', { error });
    throw error;
  }
}

async function updateSolution(id: string, body: string | null): Promise<APIGatewayProxyResult> {
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

    // First, get the existing solution
    const getCommand = new GetCommand({
      TableName: SOLUTIONS_TABLE,
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
        body: JSON.stringify({ error: 'Solution not found' }),
      };
    }

    const updatedSolution = {
      ...existingResult.Item,
      ...updateData,
      updatedAt: now,
    };

    const putCommand = new PutCommand({
      TableName: SOLUTIONS_TABLE,
      Item: updatedSolution,
    });

    await docClient.send(putCommand);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(updatedSolution),
    };
  } catch (error) {
    logger.error('Error updating solution', { error, id });
    throw error;
  }
}

async function deleteSolution(id: string): Promise<APIGatewayProxyResult> {
  try {
    const command = new DeleteCommand({
      TableName: SOLUTIONS_TABLE,
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
    logger.error('Error deleting solution', { error, id });
    throw error;
  }
} 