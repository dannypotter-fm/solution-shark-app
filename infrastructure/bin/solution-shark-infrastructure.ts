#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SolutionSharkStack } from '../lib/solution-shark-stack';

const app = new cdk.App();

// Environment configuration
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

// Create the main stack
new SolutionSharkStack(app, 'SolutionSharkStack', {
  env,
  description: 'SolutionShark - Cost-efficient serverless application stack',
  tags: {
    Project: 'SolutionShark',
    Environment: 'production',
    ManagedBy: 'CDK',
  },
});

// Add tags to all resources
cdk.Tags.of(app).add('Project', 'SolutionShark');
cdk.Tags.of(app).add('Environment', 'production');
cdk.Tags.of(app).add('ManagedBy', 'CDK'); 