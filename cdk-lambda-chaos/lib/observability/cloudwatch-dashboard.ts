import { Construct } from "constructs";
import { ObservabilityProps } from "../shared/fis-lambda-chaos-shared";
import { Dashboard, GraphWidget, Metric } from "aws-cdk-lib/aws-cloudwatch";
import { Duration } from "aws-cdk-lib";
import * as logs from "aws-cdk-lib/aws-logs";

export class CloudwatchDashboard extends Construct {

    public dashboard: Dashboard;

    constructor(scope: Construct, id: string, props: ObservabilityProps) {
        super(scope, id);

        this.dashboard = new Dashboard(this, 'LambdaChaosDashboard'+props.dashboardNameSuffix, {
            dashboardName: 'LambdaChaosDashboard-'+props.dashboardNameSuffix,
        });

        // Add metrics for AWS/Lambda
        const lambdaDuration = new Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Duration',
            statistic: 'Maximum',
            period: Duration.minutes(5),
        });

        const lambdaErrors = new Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Errors',
            statistic: 'Sum',
            period: Duration.minutes(5),
        });

        const lambdaInvocations = new Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Invocations',
            statistic: 'Sum',
            period: Duration.minutes(5),
        });

        const lambdaInvocationsWidget = new GraphWidget({
            title: 'Lambda Invocations',
        });

        const lambdaErrorsWidget = new GraphWidget({
            title: 'Lambda Errors',
        });

        const lambdaDurationWidget = new GraphWidget({
            title: 'Lambda Duration',
        });

        props?.lambdaFunctionNames.forEach(functionName => {
            const dimensions = {FunctionName: functionName};

            lambdaInvocationsWidget.addLeftMetric(
                lambdaInvocations.with({dimensionsMap: dimensions})
            );
            lambdaDurationWidget.addLeftMetric(
                lambdaDuration.with({dimensionsMap: dimensions})
            );
            lambdaErrorsWidget.addLeftMetric(
                lambdaErrors.with({dimensionsMap: dimensions})
            );
        });

        // Additional metrics from the image
        const artilleryHttpRequestsMetric = new Metric({
            namespace: props.artilleryMetricNameSpace,
            metricName: 'http.requests',
            statistic: 'Sum',
            period: Duration.minutes(5),
            dimensionsMap: {Name: 'loadtest', Service: props.artilleryServiceName}
        });

        const artilleryHttpResponsesMetric = new Metric({
            namespace: props.artilleryMetricNameSpace,
            metricName: 'http.responses',
            statistic: 'Sum',
            period: Duration.minutes(5),
            dimensionsMap: {Name: 'loadtest', Service: props.artilleryServiceName}

        });

        const artilleryHttpReqResWidget = new GraphWidget({
            title: `Artillery Request & Response`,
            left: [artilleryHttpRequestsMetric, artilleryHttpRequestsMetric],
        });
        //   APIGateway metrics
        const apiGatewayRequestCountMetric = new Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Count',
            statistic: 'Sum',
            period: Duration.minutes(5),
            dimensionsMap: {ApiName: props.apiGatewayAPIName}
        });

        //Widget for APIGateway request count
        const apiGatewayRequestCountWidget = new GraphWidget({
            title: 'APIGateway Request Count',
        });

        // add apiGatewayRequestCountWidget to dashboard
        apiGatewayRequestCountWidget.addLeftMetric(apiGatewayRequestCountMetric);

        // first row
        this.dashboard.addWidgets(artilleryHttpReqResWidget, apiGatewayRequestCountWidget, lambdaInvocationsWidget);


        /* artillery has the following metrics for response: http.response_time.min, http.response_time.max, http.response_time.p99, http.response_time.median
         create metrics for each of the above and add to a widget
         */
        const artilleryHttpResponseMinMetric = new Metric({
            namespace: props.artilleryMetricNameSpace,
            metricName: 'http.response_time.min',
            statistic: 'Maximum',
            period: Duration.minutes(5),
            dimensionsMap: {Name: 'loadtest', Service: props.artilleryServiceName}
        });
        const artilleryHttpResponseMaxMetric = new Metric({
            namespace: props.artilleryMetricNameSpace,
            metricName: 'http.response_time.max',
            statistic: 'Maximum',
            period: Duration.minutes(5),
            dimensionsMap: {Name: 'loadtest', Service: props.artilleryServiceName}
        });
        const artilleryHttpResponseP99Metric = new Metric({
            namespace: props.artilleryMetricNameSpace,
            metricName: 'http.response_time.p99',
            statistic: 'Maximum',
            period: Duration.minutes(5),
            dimensionsMap: {Name: 'loadtest', Service: props.artilleryServiceName}
        });
        const artilleryHttpResponseMedianMetric = new Metric({
            namespace: props.artilleryMetricNameSpace,
            metricName: 'http.response_time.median',
            statistic: 'Maximum',
            period: Duration.minutes(5),
            dimensionsMap: {Name: 'loadtest', Service: props.artilleryServiceName}
        });
        const artilleryHttpResponseWidget = new GraphWidget({
            title: `Artillery Recorded Latency`,
            left: [artilleryHttpResponseMinMetric, artilleryHttpResponseMaxMetric, artilleryHttpResponseP99Metric, artilleryHttpResponseMedianMetric]
        });

        //   create metric for APIGateway latency and corresponding widget
        const apiGatewayLatencyMetric = new Metric({
            namespace: 'AWS/ApiGateway',
            metricName: 'Latency',
            statistic: 'Maximum',
            period: Duration.minutes(5),
            dimensionsMap: {ApiName: props.apiGatewayAPIName}
        });
        const apiGatewayLatencyWidget = new GraphWidget({
            title: 'APIGateway Latency',
        });

        apiGatewayLatencyWidget.addLeftMetric(apiGatewayLatencyMetric);

        this.dashboard.addWidgets(artilleryHttpResponseWidget, apiGatewayLatencyWidget, lambdaDurationWidget);

        /* artillery has the following metrics for errors: http.codes.400, http.codes.500, http.codes.502,errors.ETIMEDOUT
        create metrics for each of the above and add to a widget
        */
        const artilleryHttpErrors400Metric = new Metric({
            namespace: props.artilleryMetricNameSpace,
            metricName: 'http.codes.400',
            statistic: 'Sum',
            period: Duration.minutes(5),
            dimensionsMap: {Name: 'loadtest', Service: props.artilleryServiceName}
        });
        const artilleryHttpErrors500Metric = new Metric({
            namespace: props.artilleryMetricNameSpace,
            metricName: 'http.codes.500',
            statistic: 'Sum',
            period: Duration.minutes(5),
            dimensionsMap: {Name: 'loadtest', Service: props.artilleryServiceName}
        });
        const artilleryHttpErrors502Metric = new Metric({
            namespace: props.artilleryMetricNameSpace,
            metricName: 'http.codes.502',
            statistic: 'Sum',
            period: Duration.minutes(5),
            dimensionsMap: {Name: 'loadtest', Service: props.artilleryServiceName}
        });
        const artilleryHttpErrorsETIMEDOUTMetric = new Metric({
            namespace: props.artilleryMetricNameSpace,
            metricName: 'errors.ETIMEDOUT',
            statistic: 'Sum',
            period: Duration.minutes(5),
            dimensionsMap: {Name: 'loadtest', Service: props.artilleryServiceName}
        });
        const artilleryHttpErrorsWidget = new GraphWidget({
            title: `Artillery Recorded Errors`,
            left: [artilleryHttpErrors400Metric, artilleryHttpErrors500Metric, artilleryHttpErrors502Metric, artilleryHttpErrorsETIMEDOUTMetric]
        });


        const apiGateway5xxErrorsMetric = new Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '5XXError',
            statistic: 'Sum',
            dimensionsMap: {ApiName: props.apiGatewayAPIName},
            period: Duration.minutes(5),
        });

        const apiGateway4xxErrorsMetric = new Metric({
            namespace: 'AWS/ApiGateway',
            metricName: '4XXError',
            statistic: 'Sum',
            dimensionsMap: {ApiName: props.apiGatewayAPIName},
            period: Duration.minutes(5),
        });
        // add APIGateway metric for 5XX and 4XX errors to one widget
        const apiGatewayErrorsWidget = new GraphWidget({
            title: 'APIGateway Errors',
        });
        apiGatewayErrorsWidget.addLeftMetric(apiGateway5xxErrorsMetric);
        apiGatewayErrorsWidget.addLeftMetric(apiGateway4xxErrorsMetric);

        this.dashboard.addWidgets(artilleryHttpErrorsWidget, apiGatewayErrorsWidget, lambdaErrorsWidget);
        
        const fisFaultInjectedMetric = new Metric({
            namespace: 'aws-fis-extension',
            metricName: 'FaultInjected',
            statistic: 'Sum',
            period: Duration.minutes(5),
        });
        
        // create a GraphWidget with FIS extension metric 'FaultInjected' in namespace 'aws-fis-extension'
        const fisFaultInjectedAddLatencyWidget = new GraphWidget({
            title: 'FIS FaultInjected Invocation Delay',
        });

        const fisFaultInjectedInvocationErrorWidget = new GraphWidget({
            title: 'FIS FaultInjected Invocation Error',
        });

        const fisFaultInjectedHttpResponseWidget = new GraphWidget({
            title: 'FIS FaultInjected HTTP Integration Response',
        });

        props.lambdaFunctionNames.forEach(functionName => {
     
            const dimensionsAddDelay  = {'FaultId':'aws:lambda:invocation-add-delay', Invocation:functionName};
            const dimensionsInvocationError = {'FaultId':'aws:lambda:invocation-error', Invocation:functionName};
            const dimensionsHttpResponse = {'FaultId':'aws:lambda:invocation-http-integration-response', Invocation:functionName};

            fisFaultInjectedAddLatencyWidget.addLeftMetric(
                fisFaultInjectedMetric.with({dimensionsMap: dimensionsAddDelay})
            );

            fisFaultInjectedInvocationErrorWidget.addLeftMetric(
                fisFaultInjectedMetric.with({dimensionsMap: dimensionsInvocationError})
            );

            fisFaultInjectedHttpResponseWidget.addLeftMetric(
                fisFaultInjectedMetric.with({dimensionsMap: dimensionsHttpResponse})
            );

        });
        this.dashboard.addWidgets(fisFaultInjectedAddLatencyWidget, fisFaultInjectedInvocationErrorWidget, fisFaultInjectedHttpResponseWidget);

    }
}