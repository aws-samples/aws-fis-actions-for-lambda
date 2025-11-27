#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import 'source-map-support/register';
import { FisExperimentsStack } from '../lib/fis-experiments-stack';
import { ServerlessApiStack } from '../lib/serverless-api-stack';
import { TargetTag } from '../lib/shared/fis-lambda-chaos-shared';

const stackName = "FisLambda";
const app = new cdk.App();
// Aspects.of(app).add(new AwsSolutionsChecks({verbose: true}))

let apiResourceName = 'Orders';
// Use SSM parameter path for FIS Lambda extension layer
let fisLambdaLayerParameterName = '/aws/service/fis/lambda-extension/AWS-FIS-extension-x86_64/1.x.x';
let fisLambdaTagName = 'FISExperimentReady'
let fisLambdaTagValue = 'Yes'
let fisResourceTag: TargetTag = {
    TagName: fisLambdaTagName,
    TagValue: fisLambdaTagValue
}
let fisExperimentDuration = 10 // Duration of the Fault. Measured in minutes 
let fisInvocationPercentage = 100 // Percentage of the Invocation impacted by the Fault. Measured in %
let fisStartupLatencyMilliseconds = 2000 // Latency startup delay for the latency injection experiment in milliseconds
let fisHTTPIntegrationResponseCode = 500 // HTTP response code for the  experiment with response code faults
// Proxy response structure: https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html 

const fisExperimentStack = new FisExperimentsStack(app, `${stackName}Experiments`, {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.AWS_REGION ?? process.env.CDK_DEFAULT_REGION,
    },
    ResourceTag: fisResourceTag, // This is only partially in use. Experiment template ignores tag name which is set already
    InvocationPercentage: fisInvocationPercentage,
    DurationMinutes: fisExperimentDuration,
    StartupLatencyMilliseconds: fisStartupLatencyMilliseconds,
    InvocationStatusCode: fisHTTPIntegrationResponseCode,
    StackName: stackName,
});

const lambdaStack = new ServerlessApiStack(app, `${stackName}APIs`, {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.AWS_REGION ?? process.env.CDK_DEFAULT_REGION,
    },
    StackName: stackName,
    FisLambdaLayerParameterName: fisLambdaLayerParameterName,
    ResourceTag: fisResourceTag,
    ApiResourceName: apiResourceName
});