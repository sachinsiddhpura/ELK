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
public class CardPaymentProcessor implements PaymentProcessor {

    private static final Logger log = LoggerFactory.getLogger(CardPaymentProcessor.class);

    @Override
    public PaymentMethod getSupportedMethod() {
        return PaymentMethod.CREDIT_CARD;
    }

    @Override
    public PaymentResponse processPayment(PaymentRequest request, String transactionId) {
        log.info("[CARD PROCESSOR] Contacting Acquirer Gateway (Razorpay/Visa/Mastercard) for Order: {} Amount: ₹{}",
                request.getOrderNumber(), request.getAmount());

        if ("timeout".equalsIgnoreCase(request.getSimulateFailure()) || "declined".equalsIgnoreCase(request.getSimulateFailure())) {
            log.error("[CARD DECLINED] Card network returned decline code 05: Do Not Honor / Insufficient Balance");
            return new PaymentResponse(
                    transactionId,
                    request.getOrderNumber(),
                    request.getAmount(),
                    request.getPaymentMethod(),
                    PaymentStatus.FAILED,
                    "CARD_DECLINED_05",
                    null,
                    "Card transaction was declined by issuing bank (Simulated)",
                    "3D-Secure authentication failed or insufficient balance",
                    LocalDateTime.now()
            );
        }

        int authCodeSuffix = ThreadLocalRandom.current().nextInt(100000, 999999);
        String authCode = "AUTH-CARD-" + authCodeSuffix;

        log.info("[CARD SUCCESS] 3D-Secure verified! AuthCode: {} Txn: {}", authCode, transactionId);

        return new PaymentResponse(
                transactionId,
                request.getOrderNumber(),
                request.getAmount(),
                request.getPaymentMethod(),
                PaymentStatus.SUCCESS,
                "VISA_MC_AUTH_APPROVED",
                authCode,
                "Card payment authorized with 3D-Secure 2.0 verification",
                null,
                LocalDateTime.now()
        );
    }
}

