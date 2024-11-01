import { Construct } from 'constructs';
import { LambdaFunctionProps } from '../../shared/fis-lambda-chaos-shared';
import { Code, Function } from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { CommonProps, ServerlessCrudApi } from "../serverless-crud-api";

export class LambdaApiPython extends ServerlessCrudApi {
    constructor(scope: Construct, id: string, props?: LambdaFunctionProps) {
        super(scope, id, props);
    }
}