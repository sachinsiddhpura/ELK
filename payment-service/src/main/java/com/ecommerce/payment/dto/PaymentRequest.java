package com.ecommerce.payment.dto;

import com.ecommerce.payment.model.PaymentMethod;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class PaymentRequest {

    @NotBlank(message = "Order number is required")
    private String orderNumber;

    @NotBlank(message = "Customer email is required")
    private String customerEmail;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private Double amount;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    // Optional metadata: UPI VPA or Card details or Bank name or simulated error
    private String paymentDetails; // e.g. "rahul@okaxis" or "HDFC Bank"
    private String simulateFailure; // "none", "timeout", "declined", "insufficient_funds"

    public PaymentRequest() {}

    public PaymentRequest(String orderNumber, String customerEmail, Double amount,
                          PaymentMethod paymentMethod, String paymentDetails, String simulateFailure) {
        this.orderNumber = orderNumber;
        this.customerEmail = customerEmail;
        this.amount = amount;
        this.paymentMethod = paymentMethod;
        this.paymentDetails = paymentDetails;
        this.simulateFailure = simulateFailure;
    }

    public String getOrderNumber() {
        return orderNumber;
    }

    public void setOrderNumber(String orderNumber) {
        this.orderNumber = orderNumber;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
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

    public String getPaymentDetails() {
        return paymentDetails;
    }

    public void setPaymentDetails(String paymentDetails) {
        this.paymentDetails = paymentDetails;
    }

    public String getSimulateFailure() {
        return simulateFailure;
    }

    public void setSimulateFailure(String simulateFailure) {
        this.simulateFailure = simulateFailure;
    }
}

