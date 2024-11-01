import { StackProps } from 'aws-cdk-lib';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime } from 'aws-cdk-lib/aws-lambda';

// create prefixes
export const API_PREFIXES = {
    TypeScript: 'ApyTypeScript',
    Python: 'ApiPython',
    Java: 'ApiJava'
}

export const API_CRUD_ACTIONS = {
    CREATE: 'Create',
    GET: 'Get',
    DELETE: 'Delete'
}

// create TYPESCRIPT_LAMBDA_FUNCTION_NAMES
export const TYPESCRIPT_LAMBDA_FUNCTION_NAMES = {
    GET: 'GetItemFunctionTypeScript',
    CREATE: 'CreateItemFunctionTypeScript',
    DELETE: 'DeleteItemFunctionTypeScript'
}
// create PYTHON_LAMBDA_FUNCTION_NAMES
export const PYTHON_LAMBDA_FUNCTION_NAMES = {
    GET: 'GetItemFunctionPython',
    CREATE: 'CreateItemFunctionPython',
    DELETE: 'DeleteItemFunctionPython'
}

// create JAVA_LAMBDA_FUNCTION_NAMES
export const JAVA_LAMBDA_FUNCTION_NAMES = {
    GET: 'GetItemFunctionJava',
    CREATE: 'CreateItemFunctionJava',
    DELETE: 'DeleteItemFunctionJava'
}

export const TYPESCRIPT_LAMBDA_FUNCTION_HANDLERS = {
    GET: 'getItem.handler',
    CREATE: 'createItem.handler',
    DELETE: 'deleteItem.handler'
}
// create PYTHON_LAMBDA_FUNCTION_HANDLERS
export const PYTHON_LAMBDA_FUNCTION_HANDLERS = {
    GET: 'getItem.handler',
    CREATE: 'createItem.handler',
    DELETE: 'deleteItem.handler'
}
// create JAVA_LAMBDA_FUNCTION_HANDLERS
export const JAVA_LAMBDA_FUNCTION_HANDLERS = {
    GET: 'com.serverless.ItemGetter',
    CREATE: 'com.serverless.ItemCreator',
    DELETE: 'com.serverless.ItemDeleter'
}

export const LAMBDA_FUNCTION_HANDLER_ASSETS_FOLDERS = {
    TYPESCRIPT: 'typescript',
    JAVA: 'java',
    PYTHON: 'python'
}

export interface FisExperimentStackProps extends StackProps {
    ResourceTag: TargetTag,
    DurationMinutes: number,
    InvocationPercentage: number,
    InvocationStatusCode?: number,
    StartupLatencyMilliseconds?: number,
    OriginalStackNamePrefix?: string,
    StackName: string,
}

export interface FisExperimentProps {
    ResourceTag: TargetTag,
    Prefix: string,
    ExecutionRoleARN: string,
    Experiment: "Latency" | "Response",
    DurationMinutes: number,
    InvocationPercentage: number,
    InvocationStatusCode?: number,
    StartupLatencyMilliseconds?: number,
    CloudWatchLogGroupARN: string,
    OriginalStackNamePrefix?: string,
    StackName: string,
}

export interface TargetTag {
    TagName: string,
    TagValue: string
}

export interface LambdaStackProps extends StackProps {
    StackName: string,
    FisLambdaLayerARN: string,
    ResourceTag: TargetTag,
    ApiResourceName: string,
    CanaryName?: string,
    OriginalStackNamePrefix?: string
}

export interface LambdaFunctionProps {
    ResourceTag: TargetTag,
    FisLambdaLayerARN: string,
    LambdaS3ListStatement: PolicyStatement,
    LambdaS3GetStatement: PolicyStatement,
    DDBTable: Table,
    PartitionKey: string,
    FisBucketARN: string,
    StackName: string,
    ApiResourceName: string,
    CanaryName?: string,
    OriginalStackNamePrefix?: string,
    Runtime: Runtime,
    FunctionNamesAndHandlers: Map<string, string>,
    LambdaAssetsFolder: string,
    LambdaFISLayerPolicyStatement: PolicyStatement
}

export interface ObservabilityStackProps extends StackProps {
    observabilityDashboardProps: ObservabilityProps[];
}

export interface ObservabilityProps {
  lambdaFunctionNames: string[];
  artilleryMetricNameSpace: string;
  artilleryServiceName: string;
  apiGatewayAPIName: string;
  lambdaDeployedFunctionNameToNameMap: Map<string, string>;
  dashboardNameSuffix: string;
}
