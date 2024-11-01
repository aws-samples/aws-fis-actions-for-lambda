import * as cdk from 'aws-cdk-lib';
import { CfnParameter, Fn, RemovalPolicy } from 'aws-cdk-lib';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { JAVA_LAMBDA_FUNCTION_HANDLERS, JAVA_LAMBDA_FUNCTION_NAMES, LAMBDA_FUNCTION_HANDLER_ASSETS_FOLDERS, LambdaStackProps, PYTHON_LAMBDA_FUNCTION_HANDLERS, PYTHON_LAMBDA_FUNCTION_NAMES, TargetTag, TYPESCRIPT_LAMBDA_FUNCTION_HANDLERS, TYPESCRIPT_LAMBDA_FUNCTION_NAMES } from './shared/fis-lambda-chaos-shared';
import { AttributeType, Table, TableEncryption } from 'aws-cdk-lib/aws-dynamodb';
import { LambdaApiTypeScript } from './serverless-api/typescript/serverless-api-typescript';
import { LambdaApiPython } from './serverless-api/python/serverless-api-python';
import { LambdaApiJava } from "./serverless-api/java/serverless-api-java";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { CloudwatchDashboard } from './observability/cloudwatch-dashboard';


export class ServerlessApiStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: LambdaStackProps) {
        super(scope, id, props);

        if (props == undefined) {
            throw Error('No props passed.');

        } else {
            console.log('------ Properties of the API stack -----');
            console.log('------ StackName from props:', props.StackName);
            if (!props.env?.region) {
                throw Error('Could not resolve region. Please pass it with the AWS_REGION environment variable.');
            }
        }

        // create a CfnParameter for fisLambdaLayerARN
        const fisLambdaLayerArnParam = new CfnParameter(this, "fisLambdaLayerARN", {
        type: "String",
        description: "ARN of FIS Lambda extension.",
        default: props.FisLambdaLayerARN});

        // Importing resources
        const fisBucketARN = Fn.importValue("fisBucketARN");

        // create dynamoDB Table
        const globalTableName = this.stackName
        let itemsTable;
        let partitionKey = 'Id';
        let tableProps: any = {
            partitionKey: { name: partitionKey, type: AttributeType.STRING },
            tableName: globalTableName,
            removalPolicy: RemovalPolicy.DESTROY,
            encryption: TableEncryption.DEFAULT
        };
        itemsTable = new Table(this, globalTableName, tableProps);

        //create IAM Policy Statements for Lambda functions S3 Access
        const lambdaS3ListStatement = new PolicyStatement({
            sid: "AllowLambdaToListS3Buckets",
            effect: Effect.ALLOW,
            actions: [
                "s3:ListBucket"
            ],
            resources: [fisBucketARN],
            conditions: {
                "StringLike": {
                    "s3:prefix": ["FisConfigs/*"]
                }
            }
        })
        const lambdaS3GetStatement = new PolicyStatement({
            sid: "AllowReadingObjectFromConfigLocation",
            effect: Effect.ALLOW,
            actions: [
                "s3:GetObject"
            ],
            resources: [`${fisBucketARN}/FisConfigs/*`],
        });
        // create a IAM policy for lambda:GetLayerVersion
        const lambdaGetLayerVersionStatement = new PolicyStatement({
            sid: "AllowLambdaToGetLayerVersion",
            effect: Effect.ALLOW,
            actions: [
                "lambda:GetLayerVersion"
            ],
            // resources: [fisLambdaLayerArnParam.valueAsString],
            resources: ["arn:aws:lambda:*:*:layer:AWS-FIS-Extension*:*"],

        });

        let fisResourceTag: TargetTag = {
            TagName: "ApiTypeScript" + props.ResourceTag.TagName,
            TagValue: props.ResourceTag.TagValue
        }

        const typeScriptFunctionNameHandlerMap = new Map([
            [TYPESCRIPT_LAMBDA_FUNCTION_NAMES.GET, TYPESCRIPT_LAMBDA_FUNCTION_HANDLERS.GET],
            [TYPESCRIPT_LAMBDA_FUNCTION_NAMES.CREATE, TYPESCRIPT_LAMBDA_FUNCTION_HANDLERS.CREATE],
            [TYPESCRIPT_LAMBDA_FUNCTION_NAMES.DELETE, TYPESCRIPT_LAMBDA_FUNCTION_HANDLERS.DELETE]
        ]);        
        
        const lambdaApiTypeScript = new LambdaApiTypeScript(this, "ApiTypeScript", {
            ResourceTag: fisResourceTag,
            FisLambdaLayerARN: fisLambdaLayerArnParam.valueAsString,
            StackName: props.StackName,
            LambdaS3ListStatement: lambdaS3ListStatement,
            LambdaS3GetStatement: lambdaS3GetStatement,
            DDBTable: itemsTable,
            PartitionKey: partitionKey,
            FisBucketARN: fisBucketARN,
            ApiResourceName: props.ApiResourceName,
            OriginalStackNamePrefix: "LambdaTypeScript",
            Runtime: Runtime.NODEJS_20_X,
            FunctionNamesAndHandlers: typeScriptFunctionNameHandlerMap,
            LambdaAssetsFolder: LAMBDA_FUNCTION_HANDLER_ASSETS_FOLDERS.TYPESCRIPT,
            LambdaFISLayerPolicyStatement: lambdaGetLayerVersionStatement
        });

        const deployedApiName= lambdaApiTypeScript.restApi.restApiName;
        const lambdaApiTypeScriptDashboard= new CloudwatchDashboard(this, `FISLambdaChaosCloudWatchDashboard-${deployedApiName}`, {
            lambdaFunctionNames: lambdaApiTypeScript.lambdaFunctionNames,
            artilleryMetricNameSpace: 'artillery-lambda-fault-actions-load',
            artilleryServiceName: 'orders-svc',
            apiGatewayAPIName: deployedApiName,
            lambdaDeployedFunctionNameToNameMap: lambdaApiTypeScript.lambdaFunctionNameTokenToNameMap,
            dashboardNameSuffix: LAMBDA_FUNCTION_HANDLER_ASSETS_FOLDERS.TYPESCRIPT

        });
        lambdaApiTypeScriptDashboard.node.addDependency(lambdaApiTypeScript);

        // create pythonFunctionNameHandlerMap for LambdaApiPython
        const pythonFunctionNameHandlerMap = new Map([
            [PYTHON_LAMBDA_FUNCTION_NAMES.GET, PYTHON_LAMBDA_FUNCTION_HANDLERS.GET],
            [PYTHON_LAMBDA_FUNCTION_NAMES.CREATE, PYTHON_LAMBDA_FUNCTION_HANDLERS.CREATE],
            [PYTHON_LAMBDA_FUNCTION_NAMES.DELETE, PYTHON_LAMBDA_FUNCTION_HANDLERS.DELETE]
        ]);

        fisResourceTag = {
            TagName: "ApiPython" + props.ResourceTag.TagName,
            TagValue: props.ResourceTag.TagValue
        }

        const lambdaApiPython = new LambdaApiPython(this, "ApiPython", {
            ResourceTag: fisResourceTag,
            FisLambdaLayerARN: fisLambdaLayerArnParam.valueAsString,
            StackName: props.StackName,
            LambdaS3ListStatement: lambdaS3ListStatement,
            LambdaS3GetStatement: lambdaS3GetStatement,
            DDBTable: itemsTable,
            PartitionKey: partitionKey,
            FisBucketARN: fisBucketARN,
            ApiResourceName: props.ApiResourceName,
            OriginalStackNamePrefix: "LambdaPython",
            Runtime: Runtime.PYTHON_3_12,
            FunctionNamesAndHandlers: pythonFunctionNameHandlerMap,
            LambdaAssetsFolder: LAMBDA_FUNCTION_HANDLER_ASSETS_FOLDERS.PYTHON,
            LambdaFISLayerPolicyStatement: lambdaGetLayerVersionStatement
        });
        const deployedPythonApiName= lambdaApiPython.restApi.restApiName;
        const lambdaApiPythonDashboard= new CloudwatchDashboard(this, `FISLambdaChaosCloudWatchDashboard-${deployedPythonApiName}`, {
            lambdaFunctionNames: lambdaApiPython.lambdaFunctionNames,
            artilleryMetricNameSpace: 'artillery-lambda-fault-actions-load',
            artilleryServiceName: 'orders-svc',
            apiGatewayAPIName: deployedPythonApiName,
            lambdaDeployedFunctionNameToNameMap: lambdaApiPython.lambdaFunctionNameTokenToNameMap,
            dashboardNameSuffix: LAMBDA_FUNCTION_HANDLER_ASSETS_FOLDERS.PYTHON

        });
        lambdaApiPythonDashboard.node.addDependency(lambdaApiPython);

        // create javaFunctionNameHandlerMap for lambdaApiJava
        const javaFunctionNameHandlerMap = new Map([
            [JAVA_LAMBDA_FUNCTION_NAMES.GET, JAVA_LAMBDA_FUNCTION_HANDLERS.GET],
            [JAVA_LAMBDA_FUNCTION_NAMES.CREATE, JAVA_LAMBDA_FUNCTION_HANDLERS.CREATE],
            [JAVA_LAMBDA_FUNCTION_NAMES.DELETE, JAVA_LAMBDA_FUNCTION_HANDLERS.DELETE]
        ]);

        fisResourceTag = {
            TagName: "ApiJava" + props.ResourceTag.TagName,
            TagValue: props.ResourceTag.TagValue
        }

        const lambdaApiJava = new LambdaApiJava(this, "ApiJava", {
            ResourceTag: fisResourceTag,
            FisLambdaLayerARN: fisLambdaLayerArnParam.valueAsString,
            StackName: props.StackName,
            LambdaS3ListStatement: lambdaS3ListStatement,
            LambdaS3GetStatement: lambdaS3GetStatement,
            DDBTable: itemsTable,
            PartitionKey: partitionKey,
            FisBucketARN: fisBucketARN,
            ApiResourceName: props.ApiResourceName,
            OriginalStackNamePrefix: "LambdaJava",
            Runtime: Runtime.JAVA_21,
            FunctionNamesAndHandlers: javaFunctionNameHandlerMap,
            LambdaAssetsFolder: LAMBDA_FUNCTION_HANDLER_ASSETS_FOLDERS.JAVA,
            LambdaFISLayerPolicyStatement: lambdaGetLayerVersionStatement
        });
        const deployedJavaApiName= lambdaApiJava.restApi.restApiName;
        const lambdaApiJavaDashboard= new CloudwatchDashboard(this, `FISLambdaChaosCloudWatchDashboard-${deployedJavaApiName}`, {
            lambdaFunctionNames: lambdaApiJava.lambdaFunctionNames,
            artilleryMetricNameSpace: 'artillery-lambda-fault-actions-load',
            artilleryServiceName: 'orders-svc',
            apiGatewayAPIName: deployedJavaApiName,
            lambdaDeployedFunctionNameToNameMap: lambdaApiJava.lambdaFunctionNameTokenToNameMap,
            dashboardNameSuffix: LAMBDA_FUNCTION_HANDLER_ASSETS_FOLDERS.JAVA

        });
        lambdaApiJavaDashboard.node.addDependency(lambdaApiJava);

    }
}