package com.ecommerce.order.controller;

import com.ecommerce.order.dto.OrderRequest;
import com.ecommerce.order.model.Order;
import com.ecommerce.order.model.OrderStatus;
import com.ecommerce.order.service.OrderService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private static final Logger log = LoggerFactory.getLogger(OrderController.class);

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders() {
        log.info("Fetching all orders from database");
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable Long id) {
        log.info("Retrieving order ID: {}", id);

        // INTENTIONAL BUG 1: If ID is 999, throw NullPointerException
        if (id == 999L) {
            log.error("[ORDER BUG] Invoice calculation engine received null pointer for order ID: 999");
            String nullStr = null;
            nullStr.trim(); // Triggers NullPointerException with full stack trace in log!
        }

        return orderService.getOrderById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/track/{orderNumber}")
    public ResponseEntity<?> getOrderByOrderNumber(@PathVariable String orderNumber) {
        log.info("Tracking order by order number: {}", orderNumber);
        return orderService.getOrderByOrderNumber(orderNumber)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> placeOrder(@Valid @RequestBody OrderRequest request) {
        log.info("Inbound order placement request received for customer: {}", request.getCustomerName());

        try {
            Order order = orderService.placeOrder(request);
            log.info("Order placed successfully with orderNumber: {} total: ₹{}", order.getOrderNumber(), order.getTotalAmount());
            return new ResponseEntity<>(order, HttpStatus.CREATED);
        } catch (RuntimeException e) {
            log.error("[ORDER PLACEMENT BLOCKED] Flow stopped due to error for customer {}: {}", request.getCustomerName(), e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            error.put("status", "ORDER_ABORTED");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status) {
        log.info("Updating order status for ID {} to {}", id, status);
        try {
            Order updated = orderService.updateOrderStatus(id, status);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Failed to update status for order ID {}: {}", id, e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    /**
     * DEDICATED BUG SIMULATION ENDPOINT FOR TESTING ORDER-SERVICE LOGS
     * Supports: 'payment', 'inter-service', 'inventory-leak', 'npe'
     */
    @GetMapping("/simulate-bug")
    public ResponseEntity<?> simulateBug(@RequestParam(defaultValue = "payment") String type) {
        log.warn("[BUG TEST] Order Service bug simulation triggered for type='{}'", type);

        switch (type.toLowerCase()) {
            case "inter-service":
                log.warn("[INTER-SERVICE WARN] Stock verification attempt 1/3 timed out for product-service");
                log.warn("[INTER-SERVICE WARN] Stock verification attempt 2/3 timed out for product-service");
                log.error("[INTER-SERVICE ERROR] ProductClientException: Downstream Product Service (http://localhost:8081/api/products) " +
                        "returned HTTP 503 Service Unavailable: Circuit Breaker TRIPPED",
                        new RuntimeException("Downstream HTTP 503: Product Service cluster connection refused"));
                throw new RuntimeException("Simulated Inter-Service Communication Breakdown (Product Service Unreachable)");

            case "inventory-leak":
                log.error("[DATA CORRUPTION] Critical anomaly detected: Order line-item reservation mismatch. In-memory count differs from MySQL database!");
                throw new IllegalStateException("Simulated Inventory State Inconsistency Exception in MySQL table order_items");

            case "npe":
                log.error("[NPE BUG] Null order dispatch invoice strategy found in OrderWorkflowContext");
                String npe = null;
                npe.toLowerCase();
                return ResponseEntity.ok("Unreachable");

            case "payment":
            default:
                log.warn("[PAYMENT GATEWAY] UPI payment retry threshold exceeded (3 retries)");
                log.error("[PAYMENT ERROR] PaymentGatewayException: Bank rejected transaction code 'ERR_INSUFFICIENT_FUNDS_OR_TIMEOUT': Bank response code 504",
                        new RuntimeException("Simulated Bank Gateway Timeout Exception"));
                throw new RuntimeException("Simulated Bank Payment Gateway Timeout (Status 504)");
        }
    }
}
