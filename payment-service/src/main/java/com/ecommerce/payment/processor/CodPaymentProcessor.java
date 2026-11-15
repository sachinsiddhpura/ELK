package com.ecommerce.payment.processor;

import com.ecommerce.payment.dto.PaymentRequest;
import com.ecommerce.payment.dto.PaymentResponse;
import com.ecommerce.payment.model.PaymentMethod;
import com.ecommerce.payment.model.PaymentStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.concurrent.ThreadLocalRandom;

@Component
public class CodPaymentProcessor implements PaymentProcessor {

    private static final Logger log = LoggerFactory.getLogger(CodPaymentProcessor.class);

    @Override
    public PaymentMethod getSupportedMethod() {
        return PaymentMethod.CASH_ON_DELIVERY;
    }

    @Override
    public PaymentResponse processPayment(PaymentRequest request, String transactionId) {
        log.info("[COD PROCESSOR] Booking Cash on Delivery collection for Order: {} Amount: ₹{}",
                request.getOrderNumber(), request.getAmount());

        long awbNum = ThreadLocalRandom.current().nextLong(1000000000L, 9999999999L);
        String awb = "DELHIVERY-AWB-" + awbNum;

        log.info("[COD CONFIRMED] Logistics booking generated: AWB: {} Txn: {}", awb, transactionId);

        return new PaymentResponse(
                transactionId,
                request.getOrderNumber(),
                request.getAmount(),
                PaymentMethod.CASH_ON_DELIVERY,
                PaymentStatus.SUCCESS,
                "COD_DISPATCH_CONFIRMED",
                awb,
                "Cash on Delivery pre-booking confirmed. Cash will be collected by courier agent upon delivery.",
                null,
                LocalDateTime.now()
        );
    }
}

