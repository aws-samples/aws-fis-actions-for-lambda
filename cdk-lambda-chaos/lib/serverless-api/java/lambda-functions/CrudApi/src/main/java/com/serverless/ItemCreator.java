package com.serverless;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.LambdaLogger;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.amazonaws.services.lambda.runtime.logging.LogLevel;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.serverless.model.Order;
import com.serverless.utils.DDBUtils;

public class ItemCreator extends CrudRequestHandler {

    ObjectMapper mapper = new ObjectMapper();
    DDBUtils ddbUtils = new DDBUtils();

    public ItemCreator() {
        super();
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        LambdaLogger logger = context.getLogger();

        try {
            Order order = mapper.readValue(event.getBody(), Order.class);

            if (order.getId() == null) {
                order.setId(event.getRequestContext().getRequestId());
            }

            ddbUtils.createOrder(order);

            return created("{\"message\":\"Item '" + order.getId() + "' created\"}");

        } catch (JsonMappingException e) {
            logger.log(String.format("Json Mapping Error: %s", e), LogLevel.ERROR);
            return badRequest("Order is malformed");
        } catch (Exception e) {
            logger.log(String.format("Internal Error: %s", e), LogLevel.ERROR);
            return error();
        }
    }
}
