package com.serverless;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.LambdaLogger;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.amazonaws.services.lambda.runtime.logging.LogLevel;
import com.serverless.utils.DDBUtils;
import software.amazon.awssdk.utils.StringUtils;

public class ItemDeleter extends CrudRequestHandler {

    DDBUtils ddbUtils = new DDBUtils();

    public ItemDeleter() {
        super();
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        LambdaLogger logger = context.getLogger();

        try {
            String id = event.getPathParameters().get("id");
            if (StringUtils.isEmpty(id)) {
                return badRequest("id is missing");
            }

            ddbUtils.deleteOrder(id);

            return ok("{\"message\": \"Item deleted successfully\"}");

        }  catch (Exception e) {
            logger.log(String.format("Internal Error: %s", e), LogLevel.ERROR);
            return error();
        }
    }
}