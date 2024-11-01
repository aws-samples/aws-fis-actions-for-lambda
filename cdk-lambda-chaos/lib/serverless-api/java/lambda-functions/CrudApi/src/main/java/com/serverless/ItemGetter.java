package com.serverless;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.LambdaLogger;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.amazonaws.services.lambda.runtime.logging.LogLevel;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.serverless.model.Order;
import com.serverless.utils.DDBUtils;
import software.amazon.awssdk.utils.StringUtils;

public class ItemGetter extends CrudRequestHandler {

    ObjectMapper mapper = new ObjectMapper();
    DDBUtils ddbUtils = new DDBUtils();

    public ItemGetter() {
        super();
    }

    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context)
    {
        LambdaLogger logger = context.getLogger();

        try {
            String id = event.getPathParameters().get("id");
            if (StringUtils.isEmpty(id)) {
                return badRequest("id is missing");
            }

            Order order = ddbUtils.getOrder(id);
            if (order == null) {
                return notFound("item "+ id +" not found");
            }

            return ok(mapper.writeValueAsString(order));

        }  catch (Exception e) {
            logger.log(String.format("Internal Error: %s", e), LogLevel.ERROR);
            return error();
        }
    }
}