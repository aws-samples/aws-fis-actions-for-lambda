import { BundlingOptions } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LambdaFunctionProps } from '../../shared/fis-lambda-chaos-shared';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { execSync } from "node:child_process";
import { CommonProps, ServerlessCrudApi } from "../serverless-crud-api";

export class LambdaApiJava extends ServerlessCrudApi {
    constructor(scope: Construct, id: string, props?: LambdaFunctionProps) {
        super(scope, id, props);
    }

    createLambdaFunction(commonProps: CommonProps, functionName: string, handler: string, lambdaAssetsFolder: string) {
        console.log(`Creating Lambda Function: ${functionName} --- handler: ${handler}`);
        const lambdaFunction =  new Function(this, functionName, {
            ...commonProps,
            code: Code.fromAsset(path.join(__dirname, 'lambda-functions/CrudApi'), {
                bundling: this.createBundlingOptions(commonProps.runtime)
            }),
            handler: handler,
            logGroup:this.createLogGroupForLambdaFunction(functionName),
        });
        return lambdaFunction;
    }

    createBundlingOptions(runtime: Runtime): BundlingOptions {
        return {
            image: runtime.bundlingImage,
            command: [],
            local: {
                tryBundle(outputDir: string) {
                    try {
                        execSync('mvn --version');
                    } catch {
                        return false;
                    }

                    const projectPath = path.join(__dirname, 'lambda-functions/CrudApi');

                    const commands = [
                        `cd ${projectPath}`,
                        'mvn clean install',
                        `cp target/CrudApi-1.0.jar ${outputDir}`
                    ];

                    execSync(commands.join(' && '));
                    return true;
                }
            }
        };
    }
}