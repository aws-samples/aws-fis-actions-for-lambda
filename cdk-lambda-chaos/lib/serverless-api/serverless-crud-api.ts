import { Construct } from 'constructs';
import {
    AccessLogFormat,
    EndpointType,
    IResource,
    LambdaIntegration,
    LogGroupLogDestination,
    MethodLoggingLevel,
    MockIntegration,
    PassthroughBehavior,
    RestApi
} from 'aws-cdk-lib/aws-apigateway';
import { Code, Function, LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { LogGroup } from 'aws-cdk-lib/aws-logs';
import { CfnOutput, Duration, RemovalPolicy, Tags } from 'aws-cdk-lib';
import { API_CRUD_ACTIONS, JAVA_LAMBDA_FUNCTION_NAMES, LambdaFunctionProps, PYTHON_LAMBDA_FUNCTION_NAMES, TYPESCRIPT_LAMBDA_FUNCTION_NAMES } from '../shared/fis-lambda-chaos-shared';
import * as path from 'path';

export interface CommonProps {
    environment: { [key: string]: string };
    runtime: Runtime;
    timeout: Duration;
}

export abstract class ServerlessCrudApi extends Construct {
    restApi: RestApi;
    lambdaFunctionNames: string[] = [];
    lambdaFunctionNameTokenToNameMap: Map<string, string> = new Map();
    lambdaFunctionNameToFunction: Map<string, Function> = new Map();
    lambdaFunctionNameToFunctionIntegration: Map<string, LambdaIntegration> = new Map();


    protected constructor(scope: Construct, id: string, props?: LambdaFunctionProps) {
        super(scope, id);

        if (props == undefined) {
            throw Error('No props passed.');

        } else if(props.OriginalStackNamePrefix == undefined){
            throw Error('No OriginalStackNamePrefix passed.');
        }else {
            console.log('------ Properties of the API stack -----');
            console.log('------ StackName from props:', props.StackName);
        }

        // JS Lambda Function

        //create JS Lambda function
        const commonProps: CommonProps = {
            timeout: Duration.seconds(30),
            runtime: props!.Runtime,
            environment: {
                PRIMARY_KEY: props!.PartitionKey,
                TABLE_NAME: props!.DDBTable.tableName,
                AWS_FIS_CONFIGURATION_LOCATION: `${props!.FisBucketARN}/FisConfigs/`,
                AWS_LAMBDA_EXEC_WRAPPER: '/opt/aws-fis/bootstrap',
                AWS_FIS_EXTENSION_METRICS: 'all'
            }
        };

        props.FunctionNamesAndHandlers.forEach((handlerName, functionIdentifier) =>{
            
            let lambdaFunction = this.createLambdaFunction(commonProps, functionIdentifier, handlerName, props.LambdaAssetsFolder);
            // this.lambdaFunctionNameToFunction.set(functionIdentifier, lambdaFunction);
            this.configureFunctionForExperiment(this, lambdaFunction, props!, functionIdentifier);

            let functionIntegration = new LambdaIntegration(lambdaFunction);
            this.lambdaFunctionNameToFunctionIntegration.set(functionIdentifier, functionIntegration);
            // needed for CW Dashboard stack
            this.lambdaFunctionNames.push(lambdaFunction.functionName);
            this.lambdaFunctionNameTokenToNameMap.set(lambdaFunction.functionName, functionIdentifier);
        });

        // Create an API Gateway resource for each of the CRUD operations
        const logGroup = new LogGroup(this, 'ApiGwLogs' + props!.Runtime.name);

        this.restApi = new RestApi(this, props!.ApiResourceName + '-Api', {
            restApiName: props!.ApiResourceName + '-Service-' + props!.Runtime.name,
            endpointTypes: [EndpointType.REGIONAL],
            deployOptions: {
                accessLogDestination: new LogGroupLogDestination(logGroup),
                accessLogFormat: AccessLogFormat.jsonWithStandardFields(),
                loggingLevel: MethodLoggingLevel.INFO,
            }
        });

        console.log('API url: ', this.restApi.url);

        const items = this.restApi.root.addResource(props!.ApiResourceName);
        items.addMethod('POST', this.getApiIntegrationLambdaForCreate(props.OriginalStackNamePrefix));
        this.addCorsOptions(items);

        const singleItem = items.addResource('{id}');
        singleItem.addMethod('GET', this.getApiIntegrationLambdaForGet(props.OriginalStackNamePrefix));
        singleItem.addMethod('DELETE', this.getApiIntegrationLambdaForDelete(props.OriginalStackNamePrefix));
        this.addCorsOptions(singleItem);

        new CfnOutput(this, `RestAPIName-${props.Runtime.name}`, {
            description: `Name of API Gateway resource implemented in ${props.Runtime.name}.`,
            exportName: `RestAPIName${props.Runtime.name}`.replace(/[.-]/gi, ''),
            key: `RestAPIName${props.Runtime.name}`.replace(/[.-]/gi, ''),
            value: this.restApi.restApiId});        
    }

    private getApiIntegrationLambdaForCreate(stackNamePrefix: string) {
        if(stackNamePrefix.indexOf("LambdaTypeScript") > -1){
            return this.lambdaFunctionNameToFunctionIntegration.get(TYPESCRIPT_LAMBDA_FUNCTION_NAMES.CREATE);
        }else if(stackNamePrefix.indexOf("LambdaJava") > -1){
            return this.lambdaFunctionNameToFunctionIntegration.get(JAVA_LAMBDA_FUNCTION_NAMES.CREATE);
        }else if (stackNamePrefix.indexOf("LambdaPython") > -1){
            return this.lambdaFunctionNameToFunctionIntegration.get(PYTHON_LAMBDA_FUNCTION_NAMES.CREATE);

        }else{
            throw Error('Runtime not supported: ' + stackNamePrefix);
        }
        
    }

    // create getApiIntegrationLambdaForGet
    private getApiIntegrationLambdaForGet(stackNamePrefix: string) {
        if(stackNamePrefix.indexOf("LambdaTypeScript") > -1){
            return this.lambdaFunctionNameToFunctionIntegration.get(TYPESCRIPT_LAMBDA_FUNCTION_NAMES.GET);
        }else if(stackNamePrefix.indexOf("LambdaJava") > -1){
            return this.lambdaFunctionNameToFunctionIntegration.get(JAVA_LAMBDA_FUNCTION_NAMES.GET);
        }else if (stackNamePrefix.indexOf("LambdaPython") > -1){
            return this.lambdaFunctionNameToFunctionIntegration.get(PYTHON_LAMBDA_FUNCTION_NAMES.GET);

        }else{
            throw Error('Runtime not supported: ' + stackNamePrefix);
        }

    }

    // create getApiIntegrationLambdaForDelete
    private getApiIntegrationLambdaForDelete(stackNamePrefix: string) {
        if(stackNamePrefix.indexOf("LambdaTypeScript") > -1){
            return this.lambdaFunctionNameToFunctionIntegration.get(TYPESCRIPT_LAMBDA_FUNCTION_NAMES.DELETE);
        }else if(stackNamePrefix.indexOf("LambdaJava") > -1){
            return this.lambdaFunctionNameToFunctionIntegration.get(JAVA_LAMBDA_FUNCTION_NAMES.DELETE);
        }else if (stackNamePrefix.indexOf("LambdaPython") > -1){
            return this.lambdaFunctionNameToFunctionIntegration.get(PYTHON_LAMBDA_FUNCTION_NAMES.DELETE);

        }else{
            throw Error('Runtime not supported: ' + stackNamePrefix);
        }

    }

    private configureFunctionForExperiment(construct: Construct, lambdaFunction: Function, props: LambdaFunctionProps, functionIdentifier: String): void {
        lambdaFunction.addToRolePolicy(props.LambdaS3ListStatement);
        lambdaFunction.addToRolePolicy(props.LambdaS3GetStatement);
        lambdaFunction.addToRolePolicy(props.LambdaFISLayerPolicyStatement);

        // add permission for read/write from DynamoDB Table
        props.DDBTable.grantReadWriteData(lambdaFunction);

        // Add Tags for FIS Experiments
        Tags.of(lambdaFunction).add(props.ResourceTag.TagName, props.ResourceTag.TagValue);

        // Add FIS LambdaLayer
        lambdaFunction.addLayers(LayerVersion.fromLayerVersionArn(construct, `FISLambdaLayerFor${functionIdentifier}`, props.FisLambdaLayerARN));
    }

    private addCorsOptions(apiResource: IResource) {
        apiResource.addMethod('OPTIONS', new MockIntegration({
            integrationResponses: [{
                statusCode: '200',
                responseParameters: {
                    'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
                    'method.response.header.Access-Control-Allow-Origin': "'*'",
                    'method.response.header.Access-Control-Allow-Credentials': "'false'",
                    'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
                },
            }],
            passthroughBehavior: PassthroughBehavior.NEVER,
            requestTemplates: {
                "application/json": "{\"statusCode\": 200}"
            },
        }), {
            methodResponses: [{
                statusCode: '200',
                responseParameters: {
                    'method.response.header.Access-Control-Allow-Headers': true,
                    'method.response.header.Access-Control-Allow-Methods': true,
                    'method.response.header.Access-Control-Allow-Credentials': true,
                    'method.response.header.Access-Control-Allow-Origin': true,
                },
            }]
        })
    }

    // create logGroup for LambdaFunction with functionName
    createLogGroupForLambdaFunction(functionName: string) {
        console.log('Creating LogGroup for Lambda Function: ', functionName);
        const lambdaLogGrp =  new LogGroup(this, functionName+'-LogGroup', {
            logGroupName: '/aws/lambda/' + functionName,
            removalPolicy: RemovalPolicy.DESTROY
        });
        console.log('LogGroup created: ', lambdaLogGrp.logGroupName);
        return lambdaLogGrp;
    }

    createLambdaFunction(commonProps: CommonProps, functionName: string, handler: string, lambdaAssetsFolder: string) {
        console.log(`Creating Lambda Function: ${functionName} --- handler: ${handler}`);
        const lambdaFunction =  new Function(this, functionName, {
            ...commonProps,
            code: Code.fromAsset(path.join(__dirname, lambdaAssetsFolder+"/lambda-functions")),
            handler: handler,
            logGroup:this.createLogGroupForLambdaFunction(functionName),
        });
        return lambdaFunction;
    }
}