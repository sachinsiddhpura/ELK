package com.ecommerce.payment.processor;

import com.ecommerce.payment.dto.PaymentRequest;
import com.ecommerce.payment.dto.PaymentResponse;
import com.ecommerce.payment.model.PaymentMethod;

public interface PaymentProcessor {

    PaymentMethod getSupportedMethod();

    PaymentResponse processPayment(PaymentRequest request, String transactionId);
}

