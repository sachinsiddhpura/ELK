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
public class NetBankingPaymentProcessor implements PaymentProcessor {

    private static final Logger log = LoggerFactory.getLogger(NetBankingPaymentProcessor.class);

    @Override
    public PaymentMethod getSupportedMethod() {
        return PaymentMethod.NET_BANKING;
    }

    @Override
    public PaymentResponse processPayment(PaymentRequest request, String transactionId) {
        String bank = request.getPaymentDetails() != null ? request.getPaymentDetails() : "HDFC Bank";
        log.info("[NET BANKING] Redirecting to Core Banking Portal ({}) for Order: {} Amount: ₹{}",
                bank, request.getOrderNumber(), request.getAmount());

        if ("timeout".equalsIgnoreCase(request.getSimulateFailure())) {
            log.error("[NET BANKING FAILED] Core banking server connection timed out after 5000ms");
            return new PaymentResponse(
                    transactionId,
                    request.getOrderNumber(),
                    request.getAmount(),
                    PaymentMethod.NET_BANKING,
                    PaymentStatus.FAILED,
                    "NB_TIMEOUT_504",
                    null,
                    "Net banking payment timed out: Bank portal unreachable (Simulated)",
                    "Core Banking System session expired",
                    LocalDateTime.now()
            );
        }

        int refNum = ThreadLocalRandom.current().nextInt(10000000, 99999999);
        String bankRef = "NB-" + bank.replaceAll("\\s+", "").toUpperCase() + "-" + refNum;

        log.info("[NET BANKING SUCCESS] Bank confirmation received! BankRef: {} Txn: {}", bankRef, transactionId);

        return new PaymentResponse(
                transactionId,
                request.getOrderNumber(),
                request.getAmount(),
                PaymentMethod.NET_BANKING,
                PaymentStatus.SUCCESS,
                "NB_CLEARING_CONFIRMED",
                bankRef,
                "Net banking payment cleared by " + bank,
                null,
                LocalDateTime.now()
        );
    }
}

