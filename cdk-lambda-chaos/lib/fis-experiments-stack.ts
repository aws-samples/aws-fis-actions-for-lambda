import * as cdk from 'aws-cdk-lib';
import { CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { FisExperimentStackProps, TargetTag, API_PREFIXES } from './shared/fis-lambda-chaos-shared';
import { FisLambdaExperiments } from './fis-experiments/lambda-faults/experiments';

export class FisExperimentsStack extends cdk.Stack {
    fisBucketARN: CfnOutput;

    constructor(scope: Construct, id: string, props: FisExperimentStackProps) {
        super(scope, id, props);

        // create CloudWatch Log Group for the FIS Experiments
        const fisCWLogGroup = new logs.LogGroup(this, 'FISExperimentsLambda', {
            logGroupName: "/aws/lambda/FISExperimentsLambda",
            removalPolicy: cdk.RemovalPolicy.DESTROY, // Optional: Specify the removal policy
        });

        // create the S3 Bucket for the Lambda testing

        const fisBucket = new Bucket(this, 'FisS3Bucket', {
            removalPolicy: cdk.RemovalPolicy.DESTROY, // Optional: Specify the removal policy
            encryption: BucketEncryption.S3_MANAGED, // Optional: Specify the encryption method
            versioned: true, // Optional: Enable versioning
            enforceSSL: true, // Optional: Enable SSL/TLS encryption
            blockPublicAccess: {
                blockPublicAcls: true,
                blockPublicPolicy: true,
                ignorePublicAcls: true,
                restrictPublicBuckets: true,
            }, // Optional: Block public access
        });

        // IAM policy for CloudWatch Logging
        const fisRoleCloudWatchPolicy = new PolicyStatement({
            effect: Effect.ALLOW,
            actions: [
                "logs:CreateLogDelivery",
                "logs:PutResourcePolicy",
                "logs:DescribeResourcePolicies",
                "logs:DescribeLogGroups"
            ],
            resources: ["*"]
        });

        // IAM policies for FIS
        const fisS3Statement = new PolicyStatement({
            sid: "AllowWritingAndDeletingObjectFromConfigLocation",
            effect: Effect.ALLOW,
            actions: [
                "s3:PutObject",
                "s3:DeleteObject"
            ],
            resources: [`${fisBucket.bucketArn}`,
                `${fisBucket.bucketArn}/*`,
            ],
        })
        const fisResourceTaggingPolicy = new PolicyStatement({
            sid: "AllowFisToDoTagLookups",
            effect: Effect.ALLOW,
            actions: [
                "tag:GetResources"
            ],
            resources: ["*"]
        });
        const fisLambdaPolicy = new PolicyStatement({
            sid: "AllowFisToInspectLambdaFunctions",
            effect: Effect.ALLOW,
            actions: [
                "lambda:GetFunction"
            ],
            resources: ["*"]
        });
        // Create IAM Role named "FisRoleForLambdaExperiments" with the above policies
        const fisRoleForLambdaExperiments = new cdk.aws_iam.Role(this, 'FisRoleForLambdaExperiments', {
            assumedBy: new cdk.aws_iam.ServicePrincipal('fis.amazonaws.com'),
        });
        fisRoleForLambdaExperiments.addToPolicy(fisS3Statement);
        fisRoleForLambdaExperiments.addToPolicy(fisRoleCloudWatchPolicy);
        fisRoleForLambdaExperiments.addToPolicy(fisResourceTaggingPolicy);
        fisRoleForLambdaExperiments.addToPolicy(fisLambdaPolicy);


        // FIS Latency Templates
        let prefix = API_PREFIXES.TypeScript
        let fisResourceTag: TargetTag = {
            TagName: prefix + props.ResourceTag.TagName,
            TagValue: props.ResourceTag.TagValue
        }
        
        new FisLambdaExperiments(this, "FISExperiments_LambdaLatency_" + API_PREFIXES, {
            ResourceTag: fisResourceTag, 
            Prefix: prefix,
            ExecutionRoleARN: fisRoleForLambdaExperiments.roleArn,
            Experiment: "Latency",
            InvocationPercentage: props.InvocationPercentage,
            DurationMinutes: props.DurationMinutes,
            StartupLatencyMilliseconds: props.StartupLatencyMilliseconds,
            CloudWatchLogGroupARN: fisCWLogGroup.logGroupArn,
            StackName: props.StackName,
        });

        prefix = API_PREFIXES.Python
        fisResourceTag = {
            TagName: prefix + props.ResourceTag.TagName,
            TagValue: props.ResourceTag.TagValue
        }


        new FisLambdaExperiments(this, "FISExperiments_LambdaLatency" + prefix, {
            ResourceTag: fisResourceTag,
            Prefix: prefix,
            ExecutionRoleARN: fisRoleForLambdaExperiments.roleArn,
            Experiment: "Latency",
            InvocationPercentage: props.InvocationPercentage,
            DurationMinutes: props.DurationMinutes,
            StartupLatencyMilliseconds: props.StartupLatencyMilliseconds,
            CloudWatchLogGroupARN: fisCWLogGroup.logGroupArn,
            StackName: props.StackName,
        });


        prefix = API_PREFIXES.Java
        fisResourceTag = {
            TagName: prefix + props.ResourceTag.TagName,
            TagValue: props.ResourceTag.TagValue
        }

        new FisLambdaExperiments(this, "FISExperiments_LambdaLatency" + prefix, {
            ResourceTag: fisResourceTag,
            Prefix: prefix,
            ExecutionRoleARN: fisRoleForLambdaExperiments.roleArn,
            Experiment: "Latency",
            InvocationPercentage: props.InvocationPercentage,
            DurationMinutes: props.DurationMinutes,
            StartupLatencyMilliseconds: props.StartupLatencyMilliseconds,
            CloudWatchLogGroupARN: fisCWLogGroup.logGroupArn,
            StackName: props.StackName,
        });

        // FIS Response Template

        prefix = API_PREFIXES.TypeScript
        fisResourceTag = {
            TagName: prefix + props.ResourceTag.TagName,
            TagValue: props.ResourceTag.TagValue
        }

        new FisLambdaExperiments(this, "FISExperiments_LambdaResponse" + prefix, {
            ResourceTag: fisResourceTag,
            Prefix: prefix,
            ExecutionRoleARN: fisRoleForLambdaExperiments.roleArn,
            Experiment: "Response",
            InvocationPercentage: props.InvocationPercentage,
            DurationMinutes: props.DurationMinutes,
            InvocationStatusCode: props.InvocationStatusCode,
            CloudWatchLogGroupARN: fisCWLogGroup.logGroupArn,
            StackName: props.StackName,
        });

        prefix = API_PREFIXES.Python
        fisResourceTag = {
            TagName: prefix + props.ResourceTag.TagName,
            TagValue: props.ResourceTag.TagValue
        }

        new FisLambdaExperiments(this, "FISExperiments_LambdaResponse" + prefix, {
            ResourceTag: fisResourceTag,
            Prefix: prefix,
            ExecutionRoleARN: fisRoleForLambdaExperiments.roleArn,
            Experiment: "Response",
            InvocationPercentage: props.InvocationPercentage,
            DurationMinutes: props.DurationMinutes,
            InvocationStatusCode: props.InvocationStatusCode,
            CloudWatchLogGroupARN: fisCWLogGroup.logGroupArn,
            StackName: props.StackName,
        });


        prefix = API_PREFIXES.Java
        fisResourceTag = {
            TagName: prefix + props.ResourceTag.TagName,
            TagValue: props.ResourceTag.TagValue
        }

        new FisLambdaExperiments(this, "FISExperiments_LambdaResponse" + prefix, {
            ResourceTag: fisResourceTag,
            Prefix: prefix,
            ExecutionRoleARN: fisRoleForLambdaExperiments.roleArn,
            Experiment: "Response",
            InvocationPercentage: props.InvocationPercentage,
            DurationMinutes: props.DurationMinutes,
            InvocationStatusCode: props.InvocationStatusCode,
            CloudWatchLogGroupARN: fisCWLogGroup.logGroupArn,
            StackName: props.StackName,
        });



        // Outputs
        new cdk.CfnOutput(this, "fisBucketARN", {
            value: fisBucket.bucketArn,
            exportName: "fisBucketARN"
        });

    }
}
