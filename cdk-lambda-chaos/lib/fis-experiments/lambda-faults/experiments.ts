import { aws_fis as fis } from "aws-cdk-lib";
import { FisExperimentProps } from "../../shared/fis-lambda-chaos-shared";
import { Construct } from "constructs";

export class FisLambdaExperiments extends Construct {
  constructor(scope: Construct, id: string, props?: FisExperimentProps) {
    super(scope, id);
    if (props == undefined) {
      throw Error("No props passed. Cant create experiment stack");
    }

    let tagName = props.ResourceTag.TagName
    let tagValue = props.ResourceTag.TagValue;
    let resourceTag = {
      [tagName]: tagValue
    }

    if (props.Experiment == "Latency") {
      if (props.StartupLatencyMilliseconds == undefined) {
        throw Error(
          "startupLatencyMilliseconds is not defined. It is mandatory for the Latency Experiment. Cant create experiment stack"
        );
      } else {
        // Targets
        const TargetTaggedLambda: fis.CfnExperimentTemplate.ExperimentTemplateTargetProperty =
          {
            resourceType: "aws:lambda:function",
            selectionMode: "ALL",
            resourceTags: resourceTag,
          };
        // Actions
        const fisLambdaAction: fis.CfnExperimentTemplate.ExperimentTemplateActionProperty =
          {
            actionId: "aws:lambda:invocation-add-delay",
            description: "Add Delay in Lambda Startup",
            parameters: {
              duration: `PT${props.DurationMinutes}M`,
              invocationPercentage: `${props.InvocationPercentage}`,
              startupDelayMilliseconds: `${props.StartupLatencyMilliseconds}`,
            },
            targets: {
              Functions: "TargetTaggedLambda",
            },
          };
        // Experiments
        const fisTemplateLambda = new fis.CfnExperimentTemplate(
          this,
          "fis-template-lambda-latency",
          {
            description: props.Prefix + "Lambda Latency Injection Fault",
            roleArn: props.ExecutionRoleARN,
            stopConditions: [
              {
                source: "none",
              },
            ],
            tags: {
              Name: props.Prefix + "Lambda Latency Injection Fault",
              Stackname: props.StackName,
            },
            actions: {
              instanceActions: fisLambdaAction,
            },
            targets: {
              TargetTaggedLambda: TargetTaggedLambda,
            },
            logConfiguration: {
              cloudWatchLogsConfiguration: {
                LogGroupArn: props.CloudWatchLogGroupARN,
              },
              logSchemaVersion: 2,
            },
            experimentOptions: {
              accountTargeting: "single-account",
              emptyTargetResolutionMode: "fail",
            },
          }
        );
      }
    } else if (props.Experiment == "Response") {

      let  InvocationStatusCode = props.InvocationStatusCode || 200;
      // Targets
      const TargetTaggedLambda: fis.CfnExperimentTemplate.ExperimentTemplateTargetProperty =
        {
          resourceType: "aws:lambda:function",
          selectionMode: "ALL",
          resourceTags: resourceTag,
        };
      // Actions
      const fisLambdaAction: fis.CfnExperimentTemplate.ExperimentTemplateActionProperty =
        {
          actionId: "aws:lambda:invocation-http-integration-response",
          description: "Modify Http Integration Response Action",
          parameters: {
            contentTypeHeader: "application/json",
            duration: `PT${props.DurationMinutes}M`,
            invocationPercentage: `${props.InvocationPercentage}`,
            preventExecution: "true",
            statusCode: `${InvocationStatusCode}`,
          },
          targets: {
            Functions: "TargetTaggedLambda",
          },
        };
      // Experiments
      const fisTemplateLambda = new fis.CfnExperimentTemplate(
        this,
        "fis-template-lambda-response",
        {
          description: props.Prefix + "Lambda Http Integration Response Fault",
          roleArn: props.ExecutionRoleARN,
          stopConditions: [
            {
              source: "none",
            },
          ],
          tags: {
            Name: props.Prefix + "Lambda Http Integration Response Fault",
            Stackname: props.StackName,
          },
          actions: {
            instanceActions: fisLambdaAction,
          },
          targets: {
            TargetTaggedLambda: TargetTaggedLambda,
          },
          logConfiguration: {
            cloudWatchLogsConfiguration: {
              LogGroupArn: props.CloudWatchLogGroupARN,
            },
            logSchemaVersion: 2,
          },
          experimentOptions: {
            accountTargeting: "single-account",
            emptyTargetResolutionMode: "fail",
          },
        }
      );
    }
  }
}
