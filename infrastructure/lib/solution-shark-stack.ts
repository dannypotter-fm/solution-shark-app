import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as amplify from 'aws-cdk-lib/aws-amplify';

export class SolutionSharkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ============================================================================
    // SECURITY & ENCRYPTION
    // ============================================================================
    
    // KMS key for encryption
    const encryptionKey = new kms.Key(this, 'SolutionSharkEncryptionKey', {
      enableKeyRotation: true,
      description: 'Encryption key for SolutionShark application data',
      alias: 'alias/solution-shark-encryption',
    });

    // ============================================================================
    // DATABASE - DynamoDB (Serverless, pay-per-request)
    // ============================================================================
    
    const solutionsTable = new dynamodb.Table(this, 'SolutionsTable', {
      tableName: 'solution-shark-solutions',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Cost-efficient for variable workloads
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Protect against accidental deletion
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey,
      pointInTimeRecovery: true, // Enable PITR for data protection
      timeToLiveAttribute: 'ttl', // Optional TTL for data lifecycle management
    });

    // GSI for efficient queries
    solutionsTable.addGlobalSecondaryIndex({
      indexName: 'stage-index',
      partitionKey: { name: 'stage', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    solutionsTable.addGlobalSecondaryIndex({
      indexName: 'owner-index',
      partitionKey: { name: 'owner', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'updatedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const approvalsTable = new dynamodb.Table(this, 'ApprovalsTable', {
      tableName: 'solution-shark-approvals',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'solutionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey,
      pointInTimeRecovery: true,
    });

    // GSI for approval queries
    approvalsTable.addGlobalSecondaryIndex({
      indexName: 'status-index',
      partitionKey: { name: 'status', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'submittedAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const workflowsTable = new dynamodb.Table(this, 'WorkflowsTable', {
      tableName: 'solution-shark-workflows',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey,
      pointInTimeRecovery: true,
    });

    // ============================================================================
    // API LAYER - Lambda Functions (Serverless)
    // ============================================================================
    
    // Common Lambda execution role
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // Grant DynamoDB permissions
    solutionsTable.grantReadWriteData(lambdaExecutionRole);
    approvalsTable.grantReadWriteData(lambdaExecutionRole);
    workflowsTable.grantReadWriteData(lambdaExecutionRole);

    // Solutions API Lambda
    const solutionsLambda = new lambda.Function(this, 'SolutionsLambda', {
      functionName: 'solution-shark-solutions-api',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../src/api/solutions'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        SOLUTIONS_TABLE: solutionsTable.tableName,
        APPROVALS_TABLE: approvalsTable.tableName,
        WORKFLOWS_TABLE: workflowsTable.tableName,
        POWERTOOLS_SERVICE_NAME: 'solutions-api',
        LOG_LEVEL: 'INFO',
      },
      role: lambdaExecutionRole,
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    // Approvals API Lambda
    const approvalsLambda = new lambda.Function(this, 'ApprovalsLambda', {
      functionName: 'solution-shark-approvals-api',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../src/api/approvals'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        SOLUTIONS_TABLE: solutionsTable.tableName,
        APPROVALS_TABLE: approvalsTable.tableName,
        WORKFLOWS_TABLE: workflowsTable.tableName,
        POWERTOOLS_SERVICE_NAME: 'approvals-api',
        LOG_LEVEL: 'INFO',
      },
      role: lambdaExecutionRole,
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    // Workflows API Lambda
    const workflowsLambda = new lambda.Function(this, 'WorkflowsLambda', {
      functionName: 'solution-shark-workflows-api',
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../src/api/workflows'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      environment: {
        SOLUTIONS_TABLE: solutionsTable.tableName,
        APPROVALS_TABLE: approvalsTable.tableName,
        WORKFLOWS_TABLE: workflowsTable.tableName,
        POWERTOOLS_SERVICE_NAME: 'workflows-api',
        LOG_LEVEL: 'INFO',
      },
      role: lambdaExecutionRole,
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    // ============================================================================
    // API GATEWAY (Serverless)
    // ============================================================================
    
    const api = new apigateway.RestApi(this, 'SolutionSharkAPI', {
      restApiName: 'solution-shark-api',
      description: 'SolutionShark API Gateway',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: false, // Disable for cost efficiency
        metricsEnabled: true,
      },
    });

    // API Resources and Methods
    const solutionsResource = api.root.addResource('solutions');
    const approvalsResource = api.root.addResource('approvals');
    const workflowsResource = api.root.addResource('workflows');

    // Solutions endpoints
    solutionsResource.addMethod('GET', new apigateway.LambdaIntegration(solutionsLambda));
    solutionsResource.addMethod('POST', new apigateway.LambdaIntegration(solutionsLambda));
    
    const solutionResource = solutionsResource.addResource('{id}');
    solutionResource.addMethod('GET', new apigateway.LambdaIntegration(solutionsLambda));
    solutionResource.addMethod('PUT', new apigateway.LambdaIntegration(solutionsLambda));
    solutionResource.addMethod('DELETE', new apigateway.LambdaIntegration(solutionsLambda));

    // Approvals endpoints
    approvalsResource.addMethod('GET', new apigateway.LambdaIntegration(approvalsLambda));
    approvalsResource.addMethod('POST', new apigateway.LambdaIntegration(approvalsLambda));
    
    const approvalResource = approvalsResource.addResource('{id}');
    approvalResource.addMethod('GET', new apigateway.LambdaIntegration(approvalsLambda));
    approvalResource.addMethod('PUT', new apigateway.LambdaIntegration(approvalsLambda));

    // Workflows endpoints
    workflowsResource.addMethod('GET', new apigateway.LambdaIntegration(workflowsLambda));
    workflowsResource.addMethod('POST', new apigateway.LambdaIntegration(workflowsLambda));
    
    const workflowResource = workflowsResource.addResource('{id}');
    workflowResource.addMethod('GET', new apigateway.LambdaIntegration(workflowsLambda));
    workflowResource.addMethod('PUT', new apigateway.LambdaIntegration(workflowsLambda));
    workflowResource.addMethod('DELETE', new apigateway.LambdaIntegration(workflowsLambda));

    // ============================================================================
    // FRONTEND - AWS Amplify (Supports Next.js with dynamic routes)
    // ============================================================================
    
    // Create Amplify app for Next.js deployment
    const amplifyApp = new amplify.App(this, 'SolutionSharkApp', {
      appName: 'solution-shark-app',
      description: 'SolutionShark Next.js Application',
      repository: 'https://github.com/dannypotter-fm/solution-shark-app', // Update with your repo
      oauthToken: cdk.SecretValue.secretsManager('github-token'), // Store GitHub token in Secrets Manager
      buildSpec: amplify.BuildSpec.fromObjectToYaml({
        version: '1.0',
        frontend: {
          phases: {
            preBuild: {
              commands: [
                'npm ci',
              ],
            },
            build: {
              commands: [
                'npm run build',
              ],
            },
          },
          artifacts: {
            baseDirectory: '.next',
            files: [
              '**/*',
            ],
          },
          cache: {
            paths: [
              'node_modules/**/*',
              '.next/cache/**/*',
            ],
          },
        },
      }),
      environmentVariables: {
        API_BASE_URL: api.url,
        NODE_ENV: 'production',
      },
    });

    // Add a branch for the main deployment
    const mainBranch = amplifyApp.addBranch('main', {
      branchName: 'main',
      autoBuild: true,
      environmentVariables: {
        API_BASE_URL: api.url,
      },
    });

    // ============================================================================
    // SECURITY - WAF (Web Application Firewall)
    // ============================================================================
    
    const waf = new wafv2.CfnWebACL(this, 'SolutionSharkWAF', {
      name: 'solution-shark-waf',
      scope: 'REGIONAL', // Changed from CLOUDFRONT to REGIONAL for Amplify
      defaultAction: { allow: {} },
      rules: [
        {
          name: 'RateLimit',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          action: { block: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
          },
        },
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 2,
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          overrideAction: { none: {} },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'AWSManagedRulesCommonRuleSet',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'SolutionSharkWAF',
      },
    });

    // ============================================================================
    // OUTPUTS
    // ============================================================================
    
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
      exportName: 'SolutionSharkApiUrl',
    });

    new cdk.CfnOutput(this, 'AmplifyAppUrl', {
      value: `https://${mainBranch.branchName}.${amplifyApp.appId}.amplifyapp.com`,
      description: 'Amplify App URL',
      exportName: 'SolutionSharkAmplifyUrl',
    });

    new cdk.CfnOutput(this, 'AmplifyAppId', {
      value: amplifyApp.appId,
      description: 'Amplify App ID',
      exportName: 'SolutionSharkAmplifyAppId',
    });

    new cdk.CfnOutput(this, 'SolutionsTableName', {
      value: solutionsTable.tableName,
      description: 'DynamoDB Solutions Table Name',
      exportName: 'SolutionSharkSolutionsTable',
    });

    new cdk.CfnOutput(this, 'ApprovalsTableName', {
      value: approvalsTable.tableName,
      description: 'DynamoDB Approvals Table Name',
      exportName: 'SolutionSharkApprovalsTable',
    });

    new cdk.CfnOutput(this, 'WorkflowsTableName', {
      value: workflowsTable.tableName,
      description: 'DynamoDB Workflows Table Name',
      exportName: 'SolutionSharkWorkflowsTable',
    });
  }
} 