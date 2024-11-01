package com.serverless.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbAttribute;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean;
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey;

@DynamoDbBean
public class Order {
    @JsonProperty("Id")
    private String id;

    private String deviceId;
    private double orderAmount;
    private String customerOrderId;
    private String customerId;

    private double protectionPlanAmount;

    private String deviceType;

    private String protectionPlan;

    public Order() {}

    public Order(String id) {
        this.id = id;
    }

    public double getProtectionPlanAmount() {
        return protectionPlanAmount;
    }

    public void setProtectionPlanAmount(double protectionPlanAmount) {
        this.protectionPlanAmount = protectionPlanAmount;
    }

    public String getDeviceType() {
        return deviceType;
    }

    public void setDeviceType(String deviceType) {
        this.deviceType = deviceType;
    }

    public String getProtectionPlan() {
        return protectionPlan;
    }

    public void setProtectionPlan(String protectionPlan) {
        this.protectionPlan = protectionPlan;
    }

    @DynamoDbPartitionKey
    @DynamoDbAttribute("Id")
    public String getId() {
        return this.id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public double getOrderAmount() {
        return orderAmount;
    }

    public void setOrderAmount(double orderAmount) {
        this.orderAmount = orderAmount;
    }

    public String getCustomerOrderId() {
        return customerOrderId;
    }

    public void setCustomerOrderId(String customerOrderId) {
        this.customerOrderId = customerOrderId;
    }

    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

}
