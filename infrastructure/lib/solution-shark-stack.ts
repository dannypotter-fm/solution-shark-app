import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as waf from 'aws-cdk-lib/aws-wafv2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as amplify from 'aws-cdk-lib/aws-amplify';
import { Construct } from 'constructs';

export class SolutionSharkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create KMS key for encryption
    const kmsKey = new kms.Key(this, 'SolutionSharkKMSKey', {
      enableKeyRotation: true,
      description: 'KMS key for SolutionShark application encryption',
    });

    // Create VPC for RDS
    const vpc = new ec2.Vpc(this, 'SolutionSharkVPC', {
      maxAzs: 2, // Cost optimization: use 2 AZs instead of 3
      natGateways: 1, // Cost optimization: use 1 NAT gateway
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Create security group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'SolutionSharkDBSecurityGroup', {
      vpc,
      description: 'Security group for SolutionShark PostgreSQL database',
      allowAllOutbound: false,
    });

    // Allow Lambda functions to connect to RDS
    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow Lambda functions to connect to PostgreSQL'
    );

    // Create RDS subnet group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'SolutionSharkDBSubnetGroup', {
      vpc,
      description: 'Subnet group for SolutionShark PostgreSQL database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Create database credentials in Secrets Manager
    const dbCredentials = new secretsmanager.Secret(this, 'SolutionSharkDBCredentials', {
      secretName: 'solution-shark/db-credentials',
      description: 'Database credentials for SolutionShark PostgreSQL',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'solution_shark_admin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
        passwordLength: 32,
      },
    });

    // Create PostgreSQL RDS instance (Aurora Serverless v2 for cost efficiency)
    const dbCluster = new rds.DatabaseCluster(this, 'SolutionSharkDatabase', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_4,
      }),
      instanceProps: {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.SERVERLESS, ec2.InstanceSize.SMALL),
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [dbSecurityGroup],
      },
      instances: 1, // Single instance for cost optimization
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      backup: {
        retention: cdk.Duration.days(7), // Cost optimization: 7 days retention
        preferredWindow: '03:00-04:00',
      },
      deletionProtection: false, // For development - enable for production
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development - use RETAIN for production
      credentials: rds.Credentials.fromSecret(dbCredentials),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [dbSecurityGroup],
      subnetGroup: dbSubnetGroup,
      serverlessV2MinCapacity: 0.5, // Cost optimization: minimum 0.5 ACU
      serverlessV2MaxCapacity: 2, // Cost optimization: maximum 2 ACU
      enableDataApi: true, // Enable Data API for Lambda integration
    });

    // Create DynamoDB tables (keeping for compatibility)
    const solutionsTable = new dynamodb.Table(this, 'SolutionsTable', {
      tableName: 'solutions',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: kmsKey,
    });

    const approvalsTable = new dynamodb.Table(this, 'ApprovalsTable', {
      tableName: 'approvals',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: kmsKey,
    });

    const workflowsTable = new dynamodb.Table(this, 'WorkflowsTable', {
      tableName: 'workflows',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: kmsKey,
    });

    // Create Lambda functions with RDS access
    const solutionsLambda = new lambda.Function(this, 'SolutionsLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/api/solutions'),
      environment: {
        DB_CLUSTER_ARN: dbCluster.clusterArn,
        DB_SECRET_ARN: dbCredentials.secretArn,
        DB_NAME: 'solution_shark',
        SOLUTIONS_TABLE: solutionsTable.tableName,
        APPROVALS_TABLE: approvalsTable.tableName,
        WORKFLOWS_TABLE: workflowsTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [dbSecurityGroup],
    });

    const approvalsLambda = new lambda.Function(this, 'ApprovalsLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/api/approvals'),
      environment: {
        DB_CLUSTER_ARN: dbCluster.clusterArn,
        DB_SECRET_ARN: dbCredentials.secretArn,
        DB_NAME: 'solution_shark',
        SOLUTIONS_TABLE: solutionsTable.tableName,
        APPROVALS_TABLE: approvalsTable.tableName,
        WORKFLOWS_TABLE: workflowsTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [dbSecurityGroup],
    });

    const workflowsLambda = new lambda.Function(this, 'WorkflowsLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/api/workflows'),
      environment: {
        DB_CLUSTER_ARN: dbCluster.clusterArn,
        DB_SECRET_ARN: dbCredentials.secretArn,
        DB_NAME: 'solution_shark',
        SOLUTIONS_TABLE: solutionsTable.tableName,
        APPROVALS_TABLE: approvalsTable.tableName,
        WORKFLOWS_TABLE: workflowsTable.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [dbSecurityGroup],
    });

    // Grant permissions to Lambda functions
    dbCluster.grantDataApiAccess(solutionsLambda);
    dbCluster.grantDataApiAccess(approvalsLambda);
    dbCluster.grantDataApiAccess(workflowsLambda);
    dbCredentials.grantRead(solutionsLambda);
    dbCredentials.grantRead(approvalsLambda);
    dbCredentials.grantRead(workflowsLambda);
    solutionsTable.grantReadWriteData(solutionsLambda);
    solutionsTable.grantReadWriteData(approvalsLambda);
    solutionsTable.grantReadWriteData(workflowsLambda);
    approvalsTable.grantReadWriteData(solutionsLambda);
    approvalsTable.grantReadWriteData(approvalsLambda);
    approvalsTable.grantReadWriteData(workflowsLambda);
    workflowsTable.grantReadWriteData(solutionsLambda);
    workflowsTable.grantReadWriteData(approvalsLambda);
    workflowsTable.grantReadWriteData(workflowsLambda);

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'SolutionSharkAPI', {
      restApiName: 'SolutionShark API',
      description: 'API for SolutionShark application',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key'],
      },
    });

    // Add API resources and methods
    const solutionsResource = api.root.addResource('solutions');
    const approvalsResource = api.root.addResource('approvals');
    const workflowsResource = api.root.addResource('workflows');

    // Solutions endpoints
    solutionsResource.addMethod('GET', new apigateway.LambdaIntegration(solutionsLambda));
    solutionsResource.addMethod('POST', new apigateway.LambdaIntegration(solutionsLambda));
    solutionsResource.addResource('{id}').addMethod('GET', new apigateway.LambdaIntegration(solutionsLambda));
    solutionsResource.addResource('{id}').addMethod('PUT', new apigateway.LambdaIntegration(solutionsLambda));
    solutionsResource.addResource('{id}').addMethod('DELETE', new apigateway.LambdaIntegration(solutionsLambda));

    // Approvals endpoints
    approvalsResource.addMethod('GET', new apigateway.LambdaIntegration(approvalsLambda));
    approvalsResource.addMethod('POST', new apigateway.LambdaIntegration(approvalsLambda));
    approvalsResource.addResource('{id}').addMethod('GET', new apigateway.LambdaIntegration(approvalsLambda));
    approvalsResource.addResource('{id}').addMethod('PUT', new apigateway.LambdaIntegration(approvalsLambda));

    // Workflows endpoints
    workflowsResource.addMethod('GET', new apigateway.LambdaIntegration(workflowsLambda));
    workflowsResource.addMethod('POST', new apigateway.LambdaIntegration(workflowsLambda));
    workflowsResource.addResource('{id}').addMethod('GET', new apigateway.LambdaIntegration(workflowsLambda));
    workflowsResource.addResource('{id}').addMethod('PUT', new apigateway.LambdaIntegration(workflowsLambda));
    workflowsResource.addResource('{id}').addMethod('DELETE', new apigateway.LambdaIntegration(workflowsLambda));

    // Create AWS Amplify App for Next.js hosting
    const amplifyApp = new amplify.App(this, 'SolutionSharkAmplifyApp', {
      appName: 'solution-shark-app',
      sourceCodeProvider: new amplify.GitHubSourceCodeProvider({
        owner: 'dannypotter-fm',
        repository: 'solution-shark-app',
        oauthToken: cdk.SecretValue.secretsManager('github-token'),
      }),
      buildSpec: amplify.BuildSpec.fromObjectToYaml({
        version: 1,
        frontend: {
          phases: {
            preBuild: {
              commands: ['npm ci'],
            },
            build: {
              commands: ['npm run build'],
            },
          },
          artifacts: {
            baseDirectory: '.next',
            files: ['**/*'],
          },
          cache: {
            paths: ['node_modules/**/*'],
          },
        },
      }),
    });

    // Create WAF for security
    const wafAcl = new waf.CfnWebACL(this, 'SolutionSharkWAF', {
      defaultAction: { allow: {} },
      scope: 'REGIONAL',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'SolutionSharkWAFMetrics',
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: 'RateLimitRule',
          priority: 1,
          statement: {
            rateBasedStatement: {
              limit: 2000,
              aggregateKeyType: 'IP',
            },
          },
          action: { block: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'RateLimitRule',
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: dbCluster.clusterEndpoint.hostname,
      description: 'PostgreSQL Database Endpoint',
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: dbCluster.clusterEndpoint.port.toString(),
      description: 'PostgreSQL Database Port',
    });

    new cdk.CfnOutput(this, 'DatabaseName', {
      value: 'solution_shark',
      description: 'PostgreSQL Database Name',
    });

    new cdk.CfnOutput(this, 'AmplifyAppUrl', {
      value: `https://${amplifyApp.defaultDomain}`,
      description: 'Amplify App URL',
    });

    new cdk.CfnOutput(this, 'AmplifyAppId', {
      value: amplifyApp.appId,
      description: 'Amplify App ID',
    });
  }
} 