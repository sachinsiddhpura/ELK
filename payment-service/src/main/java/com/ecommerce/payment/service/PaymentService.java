package com.ecommerce.payment.service;

import com.ecommerce.payment.dto.PaymentMethodDto;
import com.ecommerce.payment.dto.PaymentRequest;
import com.ecommerce.payment.dto.PaymentResponse;
import com.ecommerce.payment.model.PaymentMethod;
import com.ecommerce.payment.model.PaymentStatus;
import com.ecommerce.payment.model.PaymentTransaction;
import com.ecommerce.payment.processor.PaymentProcessor;
import com.ecommerce.payment.repository.PaymentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    private final PaymentRepository paymentRepository;
    private final Map<PaymentMethod, PaymentProcessor> processors = new EnumMap<>(PaymentMethod.class);

    public PaymentService(PaymentRepository paymentRepository, List<PaymentProcessor> processorList) {
        this.paymentRepository = paymentRepository;
        for (PaymentProcessor p : processorList) {
            processors.put(p.getSupportedMethod(), p);
            // Allow Card processor to handle Debit Card as well
            if (p.getSupportedMethod() == PaymentMethod.CREDIT_CARD) {
                processors.put(PaymentMethod.DEBIT_CARD, p);
            }
        }
    }

    @Transactional
    public PaymentResponse processPayment(PaymentRequest request) {
        String transactionId = generateTransactionId(request.getPaymentMethod());

        // Structured JSON Logging MDC Injection
        MDC.put("transactionId", transactionId);
        MDC.put("orderNumber", request.getOrderNumber());
        MDC.put("customerEmail", request.getCustomerEmail());
        MDC.put("paymentMethod", request.getPaymentMethod().name());
        MDC.put("amount", String.valueOf(request.getAmount()));

        try {
            log.info("Processing inbound payment request for Order: {} (Method: {}, Amount: ₹{})",
                    request.getOrderNumber(), request.getPaymentMethod(), request.getAmount());

            PaymentProcessor processor = processors.get(request.getPaymentMethod());
            if (processor == null) {
                MDC.put("paymentStatus", "FAILED");
                log.error("Unsupported payment method requested: {}", request.getPaymentMethod());
                throw new IllegalArgumentException("Unsupported payment method: " + request.getPaymentMethod());
            }

            PaymentResponse response = processor.processPayment(request, transactionId);

            // Persist transaction record in MySQL ecommerce_payment_db
            PaymentTransaction transaction = new PaymentTransaction(
                    transactionId,
                    request.getOrderNumber(),
                    request.getCustomerEmail(),
                    request.getAmount(),
                    request.getPaymentMethod(),
                    response.getStatus(),
                    response.getGatewayResponseCode(),
                    response.getGatewayReferenceNumber(),
                    response.getFailureReason(),
                    request.getPaymentDetails()
            );

            paymentRepository.save(transaction);

            MDC.put("paymentStatus", response.getStatus().name());
            MDC.put("gatewayRef", response.getGatewayReferenceNumber() != null ? response.getGatewayReferenceNumber() : "N/A");

            if (response.getStatus() == PaymentStatus.SUCCESS) {
                log.info("Payment transaction successfully committed to MySQL! TxnId: {} Ref: {}",
                        transactionId, response.getGatewayReferenceNumber());
            } else {
                log.error("Payment transaction failed! TxnId: {} Reason: {}",
                        transactionId, response.getFailureReason());
            }

            return response;
        } finally {
            MDC.clear();
        }
    }

    public List<PaymentMethodDto> getSupportedPaymentMethods() {
        return List.of(
                new PaymentMethodDto(PaymentMethod.UPI, "UPI (Google Pay / PhonePe / Paytm / BHIM)",
                        "Instant 0% fee settlement using any UPI app or Virtual Payment Address (VPA)",
                        "Most Popular", "NPCI UPI 2.0 Switch", true),
                new PaymentMethodDto(PaymentMethod.CREDIT_CARD, "Credit Card (Visa / Mastercard / RuPay)",
                        "Pay securely with domestic or international credit cards with 3D-Secure 2.0",
                        "Instant", "Razorpay / Visa Cybersource", true),
                new PaymentMethodDto(PaymentMethod.DEBIT_CARD, "Debit Card (ATM Card)",
                        "Direct bank debit with verified OTP authentication",
                        "Instant", "RuPay / Mastercard Gateway", true),
                new PaymentMethodDto(PaymentMethod.NET_BANKING, "Net Banking (All Indian Banks)",
                        "Direct online banking login via HDFC, SBI, ICICI, Axis, Kotak, and 50+ banks",
                        "Direct Bank", "Core Banking Switch", true),
                new PaymentMethodDto(PaymentMethod.WALLET, "Digital Wallets (Amazon Pay / Paytm Wallet)",
                        "One-click instant payment from linked mobile wallet balance",
                        "Fast", "Amazon Pay / Paytm PG", true),
                new PaymentMethodDto(PaymentMethod.CASH_ON_DELIVERY, "Cash on Delivery (Pay on Arrival)",
                        "Pay with cash or UPI QR code directly to the courier agent upon doorstep delivery",
                        "Cash / QR", "Delhivery Logistics COD", false)
        );
    }

    public Optional<PaymentTransaction> getTransactionById(String transactionId) {
        return paymentRepository.findByTransactionId(transactionId);
    }

    public List<PaymentTransaction> getTransactionsByOrderNumber(String orderNumber) {
        return paymentRepository.findByOrderNumberOrderByTransactionDateDesc(orderNumber);
    }

    public List<PaymentTransaction> getTransactionsByCustomer(String customerEmail) {
        return paymentRepository.findByCustomerEmailOrderByTransactionDateDesc(customerEmail);
    }

    public List<PaymentTransaction> getAllTransactions() {
        return paymentRepository.findAllByOrderByTransactionDateDesc();
    }

    private String generateTransactionId(PaymentMethod method) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMddHHmmss"));
        int rand = ThreadLocalRandom.current().nextInt(1000, 9999);
        return "TXN-" + method.name() + "-" + timestamp + "-" + rand;
    }
}

