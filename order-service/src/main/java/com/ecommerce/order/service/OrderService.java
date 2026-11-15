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

    @Transactional
    public Order placeOrder(OrderRequest request) {
        String orderNumber = generateOrderNumber();

        // Populate MDC context for structured JSON logging
        MDC.put("orderNumber", orderNumber);
        MDC.put("customerEmail", request.getCustomerEmail());
        MDC.put("paymentMethod", request.getPaymentMethod());

        try {
            log.info("Processing order for customer: {}", request.getCustomerName());

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

            for (OrderItemRequest itemReq : request.getItems()) {
                ProductDto product = productClient.getProductById(itemReq.getProductId());
                if (product == null) {
                    throw new RuntimeException("Product not found: " + itemReq.getProductId());
                }

                if (product.getStockQuantity() < itemReq.getQuantity()) {
                    throw new RuntimeException("Insufficient stock for product " + product.getName() +
                            ". Available: " + product.getStockQuantity() + ", requested: " + itemReq.getQuantity());
                }

                // Deduct stock in Product Service
                productClient.deductStock(product.getId(), itemReq.getQuantity());

                OrderItem item = new OrderItem(
                        product.getId(),
                        product.getName(),
                        product.getPrice(),
                        itemReq.getQuantity()
                );

                order.addItem(item);
                totalAmount += item.getSubtotal();
            }

            order.setTotalAmount(Math.round(totalAmount * 100.0) / 100.0);
            MDC.put("orderTotal", String.valueOf(order.getTotalAmount()));

            Order savedOrder = orderRepository.save(order);
            log.info("Successfully created order {} with total amount ₹{}", savedOrder.getOrderNumber(), savedOrder.getTotalAmount());
            return savedOrder;
        } finally {
            MDC.clear();
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
