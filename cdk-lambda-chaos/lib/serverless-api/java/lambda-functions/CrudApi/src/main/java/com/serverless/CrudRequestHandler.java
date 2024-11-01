package com.serverless;

import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;

import java.util.HashMap;
import java.util.Map;

public abstract class CrudRequestHandler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    public CrudRequestHandler() {
    }

    private APIGatewayProxyResponseEvent response() {
        return response(null);
    }

    protected APIGatewayProxyResponseEvent response(Map<String, String> headers) {
        if (headers == null) {
            headers = new HashMap<>();
        }
        headers.put("Content-Type", "application/json");

        return new APIGatewayProxyResponseEvent()
                .withHeaders(headers);
    }

    protected APIGatewayProxyResponseEvent ok(String body) {
        return response().withStatusCode(200).withBody(body);
    }

    protected APIGatewayProxyResponseEvent badRequest(String message) {
        return response().withStatusCode(400).withBody("{\"error\":\"Bad request\", \"message\":\"" + message + "\"}");
    }

    protected APIGatewayProxyResponseEvent notFound(String message) {
        return response().withStatusCode(404).withBody("{\"error\":\"Not found\", \"message\":\"" + message + "\"}");
    }

    protected APIGatewayProxyResponseEvent created(String body) {
        return response().withStatusCode(201).withBody(body);
    }

    protected APIGatewayProxyResponseEvent error() {
        return response().withStatusCode(500).withBody("{\"error\":\"Internal Server Error\", \"message\":\"Unexpected error\"}");
    }
}
