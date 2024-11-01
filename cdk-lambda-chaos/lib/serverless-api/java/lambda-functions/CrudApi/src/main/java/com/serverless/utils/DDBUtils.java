package com.serverless.utils;

import com.serverless.model.Order;
import software.amazon.awssdk.auth.credentials.EnvironmentVariableCredentialsProvider;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable;
import software.amazon.awssdk.enhanced.dynamodb.Key;
import software.amazon.awssdk.enhanced.dynamodb.TableSchema;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient;

public class DDBUtils {

    private static final String DDB_TABLE = System.getenv("TABLE_NAME");

    private static final DynamoDbClient ddb = DynamoDbClient.builder()
            .credentialsProvider(EnvironmentVariableCredentialsProvider.create())
            .region(Region.of(System.getenv("AWS_REGION")))
            .build();
    private static final DynamoDbEnhancedClient enhancedClient = DynamoDbEnhancedClient.builder()
            .dynamoDbClient(ddb)
            .build();

    private static final DynamoDbTable<Order> table = enhancedClient.table(DDB_TABLE, TableSchema.fromBean(Order.class));

    public void createOrder(Order order) {
        table.putItem(order);
    }

    public Order getOrder(String id) {
        return table.getItem(Key.builder().partitionValue(id).build());
    }

    public void deleteOrder(String id) {
        table.deleteItem(Key.builder().partitionValue(id).build());
    }

}
