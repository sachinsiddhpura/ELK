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
public class UpiPaymentProcessor implements PaymentProcessor {

    private static final Logger log = LoggerFactory.getLogger(UpiPaymentProcessor.class);

    @Override
    public PaymentMethod getSupportedMethod() {
        return PaymentMethod.UPI;
    }

    @Override
    public PaymentResponse processPayment(PaymentRequest request, String transactionId) {
        log.info("[UPI PROCESSOR] Initiating UPI handshake for Order: {} Amount: ₹{} via NPCI switch",
                request.getOrderNumber(), request.getAmount());

        // Simulated Failure Handling
        if ("timeout".equalsIgnoreCase(request.getSimulateFailure()) || "declined".equalsIgnoreCase(request.getSimulateFailure())) {
            log.error("[UPI FAILED] Bank rejected transaction on NPCI switch: ERR_UPI_GATEWAY_TIMEOUT (504)");
            return new PaymentResponse(
                    transactionId,
                    request.getOrderNumber(),
                    request.getAmount(),
                    PaymentMethod.UPI,
                    PaymentStatus.FAILED,
                    "NPCI_TIMEOUT_504",
                    null,
                    "UPI payment failed: NPCI gateway timeout (Simulated)",
                    "Bank server did not respond within 5000ms",
                    LocalDateTime.now()
            );
        }

        // Generate realistic 12-digit NPCI Unique Transaction Reference (UTR)
        long utrDigits = ThreadLocalRandom.current().nextLong(100000000000L, 999999999999L);
        String utr = "NPCI-UTR-" + utrDigits;

        String vpa = request.getPaymentDetails() != null && !request.getPaymentDetails().trim().isEmpty()
                ? request.getPaymentDetails().trim()
                : request.getCustomerEmail().split("@")[0] + "@okaxis";

        log.info("[UPI SUCCESS] Payment confirmed! VPA: {} UTR: {} Txn: {}", vpa, utr, transactionId);

        return new PaymentResponse(
                transactionId,
                request.getOrderNumber(),
                request.getAmount(),
                PaymentMethod.UPI,
                PaymentStatus.SUCCESS,
                "UPI_SETTLEMENT_SUCCESS",
                utr,
                "UPI payment successfully authorized and settled via NPCI network",
                null,
                LocalDateTime.now()
        );
    }
}

