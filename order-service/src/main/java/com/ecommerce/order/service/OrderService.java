package com.ecommerce.order.service;

import com.ecommerce.order.client.ProductClient;
import com.ecommerce.order.dto.OrderItemRequest;
import com.ecommerce.order.dto.OrderRequest;
import com.ecommerce.order.dto.ProductDto;
import com.ecommerce.order.model.Order;
import com.ecommerce.order.model.OrderItem;
import com.ecommerce.order.model.OrderStatus;
import com.ecommerce.order.repository.OrderRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final OrderRepository orderRepository;
    private final ProductClient productClient;

    public OrderService(OrderRepository orderRepository, ProductClient productClient) {
        this.orderRepository = orderRepository;
        this.productClient = productClient;
    }

    public List<Order> getAllOrders() {
        return orderRepository.findAllByOrderByOrderDateDesc();
    }

    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    public Optional<Order> getOrderByOrderNumber(String orderNumber) {
        return orderRepository.findByOrderNumber(orderNumber);
    }

    @Transactional(rollbackFor = Exception.class)
    public Order placeOrder(OrderRequest request) {
        String orderNumber = generateOrderNumber();

        // Populate MDC context for structured JSON logging
        MDC.put("orderNumber", orderNumber);
        MDC.put("customerEmail", request.getCustomerEmail());
        MDC.put("paymentMethod", request.getPaymentMethod());

        List<OrderItemRequest> deductedItems = new java.util.ArrayList<>();

        try {
            log.info("Processing order for customer: {}", request.getCustomerName());

            // 1. Check for simulated errors requested by client
            String simError = request.getSimulateError();
            if (simError != null && !simError.trim().isEmpty() && !"none".equalsIgnoreCase(simError)) {
                handleSimulatedError(simError, request);
            }

            // Also check if customer name contains "crash"
            if (request.getCustomerName() != null && request.getCustomerName().toLowerCase().contains("crash")) {
                MDC.put("errorCode", "ERR_SIMULATED_CRASH");
                log.error("[ORDER CRASH TEST] Customer name '{}' triggered emergency order failure!", request.getCustomerName());
                throw new RuntimeException("Simulated Critical Crash: Customer name contains 'crash'. Flow terminated.");
            }

            Order order = new Order();
            order.setOrderNumber(orderNumber);
            order.setCustomerName(request.getCustomerName());
            order.setCustomerEmail(request.getCustomerEmail());
            order.setCustomerPhone(request.getCustomerPhone());
            order.setShippingAddress(request.getShippingAddress());
            order.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "Credit Card");
            order.setStatus(OrderStatus.CONFIRMED);
            order.setOrderDate(LocalDateTime.now());

            double totalAmount = 0.0;

            // 2. Validate and reserve stock for each item
            for (OrderItemRequest itemReq : request.getItems()) {
                ProductDto product = productClient.getProductById(itemReq.getProductId());
                if (product == null) {
                    MDC.put("errorCode", "ERR_PRODUCT_NOT_FOUND");
                    log.error("[ORDER FAILED] Product with ID {} not found in catalog!", itemReq.getProductId());
                    throw new RuntimeException("Product not found: " + itemReq.getProductId() + ". Flow stopped.");
                }

                if (product.getStockQuantity() < itemReq.getQuantity()) {
                    MDC.put("errorCode", "ERR_INSUFFICIENT_STOCK");
                    log.error("[ORDER FAILED] Insufficient stock for product '{}'. Available: {}, Requested: {}",
                            product.getName(), product.getStockQuantity(), itemReq.getQuantity());
                    throw new RuntimeException("Insufficient stock for product '" + product.getName() +
                            "'. Available: " + product.getStockQuantity() + ", requested: " + itemReq.getQuantity() + ". Flow stopped.");
                }

                // Deduct stock in Product Service
                productClient.deductStock(product.getId(), itemReq.getQuantity());
                deductedItems.add(itemReq);

                OrderItem item = new OrderItem(
                        product.getId(),
                        product.getName(),
                        product.getPrice(),
                        itemReq.getQuantity()
                );

                order.addItem(item);
                totalAmount += item.getSubtotal();
            }

            // 3. Payment verification
            if ("FailPayment".equalsIgnoreCase(request.getPaymentMethod())) {
                MDC.put("errorCode", "ERR_PAYMENT_FAILED");
                log.error("[PAYMENT ERROR] Payment gateway rejected transaction: 504 Gateway Timeout while contacting Razorpay/UPI gateway");
                throw new RuntimeException("Payment Gateway Error: 504 Gateway Timeout. Flow stopped.");
            }

            order.setTotalAmount(Math.round(totalAmount * 100.0) / 100.0);
            MDC.put("orderTotal", String.valueOf(order.getTotalAmount()));

            Order savedOrder = orderRepository.save(order);
            log.info("Successfully created order {} with total amount ₹{}", savedOrder.getOrderNumber(), savedOrder.getTotalAmount());
            return savedOrder;
        } catch (Exception e) {
            // Compensate/Roll back any deducted inventory in product-service
            for (OrderItemRequest deducted : deductedItems) {
                try {
                    productClient.restoreStock(deducted.getProductId(), deducted.getQuantity());
                } catch (Exception ex) {
                    log.error("Compensating stock restoration failed for productId {}: {}", deducted.getProductId(), ex.getMessage());
                }
            }
            MDC.put("orderStatus", "FAILED_ABORTED");
            log.error("[ORDER FLOW STOPPED] Order placement failed: '{}'. No order was persisted in MySQL.", e.getMessage(), e);
            throw e instanceof RuntimeException ? (RuntimeException) e : new RuntimeException(e.getMessage(), e);
        } finally {
            MDC.clear();
        }
    }

    private void handleSimulatedError(String simError, OrderRequest request) {
        switch (simError.toLowerCase()) {
            case "payment_timeout":
            case "payment":
                MDC.put("errorCode", "ERR_PAYMENT_GATEWAY_504");
                log.warn("[PAYMENT GATEWAY] Pre-authorization check initiated with UPI payment gateway...");
                log.error("[PAYMENT TIMEOUT] HTTP 504 Gateway Timeout: Razorpay/UPI server did not respond within 5000ms. Aborting order flow!",
                        new RuntimeException("Simulated Bank Gateway Timeout Exception (HTTP 504)"));
                throw new RuntimeException("Payment Gateway Error: 504 Gateway Timeout. Payment was declined; order flow stopped.");

            case "insufficient_stock":
            case "stock":
                MDC.put("errorCode", "ERR_STOCK_RESERVATION_400");
                log.error("[INVENTORY ERROR] Warehouse stock check failed: Real-time stock audit returned 0 available units. Aborting order flow!",
                        new RuntimeException("Simulated InsufficientStockException: Zero inventory allocation"));
                throw new RuntimeException("Inventory Error: Item is out of stock in warehouse. Order flow stopped.");

            case "downstream_failure":
            case "product_service_down":
                MDC.put("errorCode", "ERR_DOWNSTREAM_503");
                log.error("[DOWNSTREAM FAILURE] Product Service (http://localhost:8081/api/products) returned HTTP 503 Service Unavailable. Circuit breaker TRIPPED!",
                        new RuntimeException("Simulated ConnectException: Connection refused to product-service:8081"));
                throw new RuntimeException("Downstream Service Error: Product catalog service unavailable (HTTP 503). Order flow stopped.");

            case "null_pointer":
            case "npe":
                MDC.put("errorCode", "ERR_INTERNAL_NPE_500");
                log.error("[CRITICAL NPE] Unhandled NullPointerException in OrderProcessingEngine dispatch strategy. Aborting transaction!",
                        new NullPointerException("Cannot invoke 'String.toUpperCase()' because 'dispatchWorkflow' is null"));
                String nullPointer = null;
                nullPointer.toUpperCase();
                break;

            default:
                break;
        }
    }

    public Order updateOrderStatus(Long id, OrderStatus status) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Order not found with id: " + id));
        order.setStatus(status);
        return orderRepository.save(order);
    }

    private String generateOrderNumber() {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMddHHmm"));
        int randomSuffix = ThreadLocalRandom.current().nextInt(1000, 9999);
        return "ORD-" + timestamp + "-" + randomSuffix;
    }
}
