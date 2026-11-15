package com.ecommerce.gateway.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/system")
public class HealthDashboardController {

    @Value("${services.product.url:http://localhost:8081}")
    private String productServiceUrl;

    @Value("${services.order.url:http://localhost:8082}")
    private String orderServiceUrl;

    @Value("${services.auth.url:http://localhost:8083}")
    private String authServiceUrl;

    @Value("${services.payment.url:http://localhost:8084}")
    private String paymentServiceUrl;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(2))
            .build();

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getSystemHealth() {
        Map<String, Object> statusMap = new HashMap<>();
        statusMap.put("timestamp", LocalDateTime.now().toString());
        statusMap.put("gateway", Map.of("status", "UP", "port", 8080));

        Map<String, Object> services = new HashMap<>();
        services.put("product-service", checkServiceHealth(productServiceUrl + "/actuator/health", 8081));
        services.put("order-service", checkServiceHealth(orderServiceUrl + "/actuator/health", 8082));
        services.put("auth-service", checkServiceHealth(authServiceUrl + "/actuator/health", 8083));
        services.put("payment-service", checkServiceHealth(paymentServiceUrl + "/actuator/health", 8084));

        statusMap.put("services", services);
        return ResponseEntity.ok(statusMap);
    }

    private Map<String, Object> checkServiceHealth(String url, int port) {
        Map<String, Object> health = new HashMap<>();
        health.put("port", port);
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(2))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                health.put("status", "UP");
            } else {
                health.put("status", "DEGRADED");
                health.put("code", response.statusCode());
            }
        } catch (Exception e) {
            health.put("status", "DOWN");
            health.put("error", e.getMessage());
        }
        return health;
    }
}

