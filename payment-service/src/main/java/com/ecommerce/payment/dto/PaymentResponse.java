package com.ecommerce.payment.dto;

import com.ecommerce.payment.model.PaymentMethod;
import com.ecommerce.payment.model.PaymentStatus;
import java.time.LocalDateTime;

public class PaymentResponse {

    private String transactionId;
    private String orderNumber;
    private Double amount;
    private PaymentMethod paymentMethod;
    private PaymentStatus status;
    private String gatewayResponseCode;
    private String gatewayReferenceNumber;
    private String message;
    private String failureReason;
    private LocalDateTime timestamp;

    public PaymentResponse() {}

    public PaymentResponse(String transactionId, String orderNumber, Double amount,
                           PaymentMethod paymentMethod, PaymentStatus status,
                           String gatewayResponseCode, String gatewayReferenceNumber,
                           String message, String failureReason, LocalDateTime timestamp) {
        this.transactionId = transactionId;
        this.orderNumber = orderNumber;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.status = status;
        this.gatewayResponseCode = gatewayResponseCode;
        this.gatewayReferenceNumber = gatewayReferenceNumber;
        this.message = message;
        this.failureReason = failureReason;
        this.timestamp = timestamp;
    }

    public String getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public void setStatus(PaymentStatus status) {
        this.status = status;
    }

    public String getGatewayResponseCode() {
        return gatewayResponseCode;
    }

    public void setGatewayResponseCode(String gatewayResponseCode) {
        this.gatewayResponseCode = gatewayResponseCode;
    }

    public String getGatewayReferenceNumber() {
        return gatewayReferenceNumber;
    }

    public void setGatewayReferenceNumber(String gatewayReferenceNumber) {
        this.gatewayReferenceNumber = gatewayReferenceNumber;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}

