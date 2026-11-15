package com.ecommerce.order.client;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Component
public class PaymentClient {

    private static final Logger log = LoggerFactory.getLogger(PaymentClient.class);

    private final RestClient restClient;

    public PaymentClient(@Value("${payment.service.url:http://localhost:8084/api/payments}") String paymentUrl) {
        log.info("Initializing PaymentClient with URL: {}", paymentUrl);
        this.restClient = RestClient.builder()
                .baseUrl(paymentUrl)
                .build();
    }

    public Map<String, Object> processPayment(String orderNumber, String customerEmail,
                                             Double amount, String paymentMethod,
                                             String paymentDetails, String simulateFailure) {
        log.info("[PAYMENT CLIENT] Calling payment-service for order={}, amount=₹{}, method={}",
                orderNumber, amount, paymentMethod);

        Map<String, Object> payload = Map.of(
                "orderNumber", orderNumber,
                "customerEmail", customerEmail,
                "amount", amount,
                "paymentMethod", mapPaymentMethod(paymentMethod),
                "paymentDetails", paymentDetails != null ? paymentDetails : "",
                "simulateFailure", simulateFailure != null ? simulateFailure : "none"
        );

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restClient.post()
                    .uri("/process")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(Map.class);

            log.info("[PAYMENT CLIENT] Payment response received: transactionId={}, status={}",
                    response != null ? response.get("transactionId") : null,
                    response != null ? response.get("status") : null);

            return response;
        } catch (Exception e) {
            log.error("[PAYMENT CLIENT ERROR] Failed to communicate with payment-service: {}", e.getMessage());
            throw new RuntimeException("Payment processing failed: " + e.getMessage(), e);
        }
    }

    private String mapPaymentMethod(String method) {
        if (method == null) return "CREDIT_CARD";
        String m = method.toUpperCase().replace(" ", "_");
        if (m.contains("UPI") || m.contains("GPAY") || m.contains("PHONEPE") || m.contains("PAYTM")) return "UPI";
        if (m.contains("DEBIT")) return "DEBIT_CARD";
        if (m.contains("CREDIT") || m.contains("CARD")) return "CREDIT_CARD";
        if (m.contains("NET") || m.contains("BANK")) return "NET_BANKING";
        if (m.contains("CASH") || m.contains("COD") || m.contains("DELIVERY")) return "CASH_ON_DELIVERY";
        if (m.contains("WALLET")) return "WALLET";
        return "CREDIT_CARD";
    }
}

