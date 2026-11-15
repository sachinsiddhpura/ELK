package com.ecommerce.order.controller;

import com.ecommerce.order.dto.OrderRequest;
import com.ecommerce.order.model.Order;
import com.ecommerce.order.model.OrderStatus;
import com.ecommerce.order.security.JwtValidator;
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
    private final JwtValidator jwtValidator;

    public OrderController(OrderService orderService, JwtValidator jwtValidator) {
        this.orderService = orderService;
        this.jwtValidator = jwtValidator;
    }

    /**
     * WOOCOMMERCE ORDER ACCESS POLICY:
     * - Anonymous visitors: 401 Unauthorized (Cannot view all orders!)
     * - Customers: Can strictly view ONLY their own orders
     * - Administrators: Can view all customer orders across the platform
     */
    @GetMapping
    public ResponseEntity<?> getAllOrders(
            @RequestParam(required = false) String customerEmail,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("[SECURITY REJECTION] Anonymous visitor attempted to access orders list without login!");
            Map<String, String> error = new HashMap<>();
            error.put("error", "Unauthorized: Please log in to your account to view order history.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        String token = authHeader.substring(7);
        if (!jwtValidator.isValid(token)) {
            log.warn("[SECURITY REJECTION] Invalid or expired JWT token presented for orders list");
            Map<String, String> error = new HashMap<>();
            error.put("error", "Session expired or invalid token. Please log in again.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        boolean isAdmin = jwtValidator.isAdmin(token);
        String tokenEmail = jwtValidator.getEmail(token);

        if (isAdmin) {
            if (customerEmail != null && !customerEmail.trim().isEmpty()) {
                log.info("[ADMIN PRIVILEGE] Querying MySQL orders for customer: {}", customerEmail);
                return ResponseEntity.ok(orderService.getOrdersByCustomerEmail(customerEmail.trim()));
            }
            log.info("[ADMIN PRIVILEGE] Fetching all orders across entire MySQL database");
            return ResponseEntity.ok(orderService.getAllOrders());
        }

        // For Authenticated Customers: Strictly query ONLY orders belonging to their verified email
        log.info("[CUSTOMER ACCOUNT] Fetching orders from MySQL for authenticated email: {}", tokenEmail);
        return ResponseEntity.ok(orderService.getOrdersByCustomerEmail(tokenEmail));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(
            @PathVariable Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        log.info("Retrieving order ID: {}", id);

        // INTENTIONAL BUG 1: If ID is 999, throw NullPointerException
        if (id == 999L) {
            log.error("[ORDER BUG] Invoice calculation engine received null pointer for order ID: 999");
            String nullStr = null;
            nullStr.trim();
        }

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Please log in to view order details"));
        }

        String token = authHeader.substring(7);
        if (!jwtValidator.isValid(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid session"));
        }

        boolean isAdmin = jwtValidator.isAdmin(token);
        String tokenEmail = jwtValidator.getEmail(token);

        return orderService.getOrderById(id)
                .map(order -> {
                    if (!isAdmin && !order.getCustomerEmail().equalsIgnoreCase(tokenEmail)) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN).body((Object) Map.of("error", "Forbidden: You cannot view another customer's order"));
                    }
                    return ResponseEntity.ok((Object) order);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Single Order Tracking (WooCommerce Track Order)
     * Allows lookup by order number and verified customer email
     */
    @GetMapping("/track/{orderNumber}")
    public ResponseEntity<?> getOrderByOrderNumber(
            @PathVariable String orderNumber,
            @RequestParam(required = false) String email,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        log.info("Tracking order by order number: {}", orderNumber);

        return orderService.getOrderByOrderNumber(orderNumber)
                .map(order -> {
                    // If authenticated
                    if (authHeader != null && authHeader.startsWith("Bearer ")) {
                        String token = authHeader.substring(7);
                        if (jwtValidator.isValid(token)) {
                            if (jwtValidator.isAdmin(token) || order.getCustomerEmail().equalsIgnoreCase(jwtValidator.getEmail(token))) {
                                return ResponseEntity.ok((Object) order);
                            }
                        }
                    }
                    // Guest tracking requires matching email
                    if (email != null && order.getCustomerEmail().equalsIgnoreCase(email.trim())) {
                        return ResponseEntity.ok((Object) order);
                    }
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                            .body((Object) Map.of("error", "Please enter the matching billing email or log in to view this order"));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * WOOCOMMERCE CHECKOUT POLICY:
     * - Must be signed in with a valid JWT token to complete an order
     */
    @PostMapping
    public ResponseEntity<?> placeOrder(
            @Valid @RequestBody OrderRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.warn("[CHECKOUT REJECTED] Anonymous visitor tried to place order without signing in!");
            Map<String, String> error = new HashMap<>();
            error.put("error", "Authentication Required: You must be logged in to your account to place an order (WooCommerce Checkout Policy).");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        String token = authHeader.substring(7);
        if (!jwtValidator.isValid(token)) {
            log.warn("[CHECKOUT REJECTED] Invalid or expired JWT token presented during checkout");
            Map<String, String> error = new HashMap<>();
            error.put("error", "Session expired. Please sign in again to complete your order.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }

        String tokenEmail = jwtValidator.getEmail(token);
        boolean isAdmin = jwtValidator.isAdmin(token);

        // Bind order to authenticated customer's email
        if (!isAdmin && tokenEmail != null) {
            request.setCustomerEmail(tokenEmail);
        }

        log.info("Inbound authenticated order placement for customer: {} ({})", request.getCustomerName(), request.getCustomerEmail());

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

    /**
     * ADMIN ONLY: Update order status
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable Long id,
            @RequestParam OrderStatus status,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        String token = authHeader.substring(7);
        if (!jwtValidator.isValid(token) || !jwtValidator.isAdmin(token)) {
            log.warn("[SECURITY VIOLATION] Non-admin attempted to update order ID {} status to {}", id, status);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Forbidden: Only administrators can update order status"));
        }

        log.info("[ADMIN] Updating order status for ID {} to {}", id, status);
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
