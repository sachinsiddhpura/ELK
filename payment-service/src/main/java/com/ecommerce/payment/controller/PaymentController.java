package com.ecommerce.payment.controller;

import com.ecommerce.payment.dto.PaymentMethodDto;
import com.ecommerce.payment.dto.PaymentRequest;
import com.ecommerce.payment.dto.PaymentResponse;
import com.ecommerce.payment.model.PaymentStatus;
import com.ecommerce.payment.model.PaymentTransaction;
import com.ecommerce.payment.service.PaymentService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@CrossOrigin(origins = "*")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    @PostMapping("/process")
    public ResponseEntity<?> processPayment(@Valid @RequestBody PaymentRequest request) {
        log.info("Inbound payment API request for order: {} amount: ₹{}", request.getOrderNumber(), request.getAmount());

        try {
            PaymentResponse response = paymentService.processPayment(request);
            if (response.getStatus() == PaymentStatus.SUCCESS) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(response);
            }
        } catch (IllegalArgumentException e) {
            log.error("Invalid payment parameters: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            log.error("Payment processing error: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Payment processing failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/methods")
    public ResponseEntity<List<PaymentMethodDto>> getSupportedMethods() {
        return ResponseEntity.ok(paymentService.getSupportedPaymentMethods());
    }

    @GetMapping("/transaction/{transactionId}")
    public ResponseEntity<?> getTransaction(@PathVariable String transactionId) {
        return paymentService.getTransactionById(transactionId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/order/{orderNumber}")
    public ResponseEntity<List<PaymentTransaction>> getTransactionsByOrder(@PathVariable String orderNumber) {
        return ResponseEntity.ok(paymentService.getTransactionsByOrderNumber(orderNumber));
    }

    @GetMapping("/all")
    public ResponseEntity<List<PaymentTransaction>> getAllTransactions() {
        return ResponseEntity.ok(paymentService.getAllTransactions());
    }
}

