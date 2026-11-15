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
public class WalletPaymentProcessor implements PaymentProcessor {

    private static final Logger log = LoggerFactory.getLogger(WalletPaymentProcessor.class);

    @Override
    public PaymentMethod getSupportedMethod() {
        return PaymentMethod.WALLET;
    }

    @Override
    public PaymentResponse processPayment(PaymentRequest request, String transactionId) {
        String wallet = request.getPaymentDetails() != null ? request.getPaymentDetails() : "Paytm Wallet";
        log.info("[WALLET PROCESSOR] Deducting balance from {} for Order: {} Amount: ₹{}",
                wallet, request.getOrderNumber(), request.getAmount());

        long walletTxnId = ThreadLocalRandom.current().nextLong(100000000L, 999999999L);
        String walletRef = "WALLET-" + wallet.replaceAll("\\s+", "").toUpperCase() + "-" + walletTxnId;

        log.info("[WALLET SUCCESS] Instant balance debit successful! Ref: {} Txn: {}", walletRef, transactionId);

        return new PaymentResponse(
                transactionId,
                request.getOrderNumber(),
                request.getAmount(),
                PaymentMethod.WALLET,
                PaymentStatus.SUCCESS,
                "WALLET_DEBIT_SUCCESS",
                walletRef,
                "Payment debited instantly from " + wallet,
                null,
                LocalDateTime.now()
        );
    }
}

