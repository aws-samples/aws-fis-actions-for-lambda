import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { FisExperimentsStack } from '../lib/fis-experiments-stack';
import { FisExperimentStackProps, TargetTag } from '../lib/shared/fis-lambda-chaos-shared';

describe('FisExperimentsStack', () => {
  let app: cdk.App;
  let stack: FisExperimentsStack;
  let template: Template;

  const stackName = "FisLambda";
const app = new cdk.App();
Aspects.of(app).add(new AwsSolutionsChecks({verbose: true}))

let apiResourceName = 'Orders';
// TODO get lambda arn from SSM
let fisLambdaLayerARN = 'arn:aws:lambda:us-east-1:905417995513:layer:AWS-FIS-Extension-x86_64:2';
let fisLambdaTagName = 'FISExperimentReady'
let fisLambdaTagValue = 'Yes'
let fisResourceTag: TargetTag = {
    TagName: fisLambdaTagName,
    TagValue: fisLambdaTagValue
}
let fisExperimentDuration = 10 // Duration of the Fault. Measured in minutes 
let fisInvocationPercentage = 100 // Percentage of the Invocation impacted by the Fault. Measured in %
let fisStartupLatencyMilliseconds = 2000 // Latency startup delay for the latency injection experiment in milliseconds
// Proxy response structure: https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html 
let fisReplaceOutputWithString = `{"statusCode":"429", "body":"Too Many Requests"}`

  beforeEach(() => {
    app = new cdk.App();

    const fisProps: FisExperimentStackProps = {
        env: {
            account: process.env.CDK_DEFAULT_ACCOUNT,
            region: process.env.AWS_REGION ?? process.env.CDK_DEFAULT_REGION,
        },
        ResourceTag: fisResourceTag, // This is only partially in use. Experiment template ignores tag name which is set already
        InvocationPercentage: fisInvocationPercentage,
        DurationMinutes: fisExperimentDuration,
        StartupLatencyMilliseconds: fisStartupLatencyMilliseconds,
        ReplaceOutputWithString: fisReplaceOutputWithString,
        StackName: stackName,
    };

    stack = new FisExperimentsStack(app, 'FisLambdaChaosStack', fisProps);
    template = Template.fromStack(stack);
  });

  test('FIS Experiment Template Created', () => {
    template.resourceCountIs('AWS::FIS::ExperimentTemplate', 1);
    template.hasResourceProperties('AWS::FIS::ExperimentTemplate', {
      Description: expect.stringContaining('FisLambdaChaosStack'),
      Targets: {
        LambdaTarget: {
          ResourceType: 'aws:lambda:function',
          ResourceTags: {
            'aws:cloudformation:stack-name': 'MyLambdaStack'
          }
        }
      },
      Actions: {
        LatencyInjection: {
          ActionId: 'aws:lambda:latency-injection',
          Parameters: {
            DurationInMilliseconds: '3000',
            Percentage: '50'
          }
        },
        ErrorInjection: {
          ActionId: 'aws:lambda:error-injection',
          Parameters: {
            ExceptionMessage: 'Error: Chaos experiment in progress',
            Percentage: '50'
          }
        }
      },
      StopConditions: [
        {
          Source: 'aws:cloudwatch:alarm'
        }
      ],
      Tags: {
        StackName: 'FisLambdaChaosStack'
      }
    });
  });

  test('FIS Experiment Created', () => {
    template.resourceCountIs('AWS::FIS::Experiment', 1);
    template.hasResourceProperties('AWS::FIS::Experiment', {
      ExperimentTemplateId: {
        Ref: expect.stringMatching(/FisExperimentTemplate/)
      },
      Tags: {
        StackName: 'FisLambdaChaosStack'
      }
    });
  });

  test('Experiment Duration Set Correctly', () => {
    template.hasResourceProperties('AWS::FIS::ExperimentTemplate', {
      StopConditions: expect.arrayContaining([
        expect.objectContaining({
          Value: '600' // 10 minutes in seconds
        })
      ])
    });
  });
});
