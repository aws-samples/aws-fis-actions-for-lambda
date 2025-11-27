import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { FisExperimentsStack } from '../lib/fis-experiments-stack';
import { FisExperimentStackProps, TargetTag } from '../lib/shared/fis-lambda-chaos-shared';

describe('FisExperimentsStack', () => {
  let app: cdk.App;
  let stack: FisExperimentsStack;
  let template: Template;

  const stackName = "FisLambda";
  const fisLambdaTagName = 'FISExperimentReady';
  const fisLambdaTagValue = 'Yes';
  const fisResourceTag: TargetTag = {
    TagName: fisLambdaTagName,
    TagValue: fisLambdaTagValue
  };
  const fisExperimentDuration = 10; // Duration of the Fault. Measured in minutes 
  const fisInvocationPercentage = 100; // Percentage of the Invocation impacted by the Fault. Measured in %
  const fisStartupLatencyMilliseconds = 2000; // Latency startup delay for the latency injection experiment in milliseconds
  // Proxy response structure: https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html 
  beforeEach(() => {
    app = new cdk.App();

    const fisProps: FisExperimentStackProps = {
        env: {
            account: process.env.CDK_DEFAULT_ACCOUNT,
            region: process.env.AWS_REGION ?? process.env.CDK_DEFAULT_REGION,
        },
        ResourceTag: fisResourceTag, 
        DurationMinutes: fisExperimentDuration,
        InvocationPercentage: fisInvocationPercentage,
        StartupLatencyMilliseconds: fisStartupLatencyMilliseconds,
        StackName: stackName,
    };

    stack = new FisExperimentsStack(app, 'FisLambdaChaosStack', fisProps);
    template = Template.fromStack(stack);
  });

  test('FIS Experiment Template Created', () => {
    template.resourceCountIs('AWS::FIS::ExperimentTemplate', 6);
    template.hasResourceProperties('AWS::FIS::ExperimentTemplate', {
      Tags: {
        Stackname: stackName
      },
      Actions: {
        instanceActions: {
          Targets: {
            Functions: "TargetTaggedLambda"
          }
        }
      }
    });
  });
});
