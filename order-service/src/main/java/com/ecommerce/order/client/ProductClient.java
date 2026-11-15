package com.ecommerce.order.client;

import com.ecommerce.order.dto.ProductDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class ProductClient {

    private static final Logger log = LoggerFactory.getLogger(ProductClient.class);

    private final RestClient restClient;

    public ProductClient(@Value("${product.service.url:http://localhost:8081/api/products}") String productUrl) {
        log.info("Initializing ProductClient with target URL: {}", productUrl);
        this.restClient = RestClient.builder()
                .baseUrl(productUrl)
                .build();
    }

    public ProductDto getProductById(Long productId) {
        log.info("Fetching product details for ID: {}", productId);
        return restClient.get()
                .uri("/{id}", productId)
                .retrieve()
                .onStatus(HttpStatusCode::is4xxClientError, (req, resp) -> {
                    throw new RuntimeException("Product with ID " + productId + " was not found in catalog");
                })
                .body(ProductDto.class);
    }

    public void deductStock(Long productId, int quantity) {
        log.info("Deducting {} units from product ID: {}", quantity, productId);
        restClient.put()
                .uri("/{id}/deduct-stock?quantity={qty}", productId, quantity)
                .retrieve()
                .onStatus(HttpStatusCode::isError, (req, resp) -> {
                    throw new RuntimeException("Failed to reserve stock for product ID " + productId + ". Insufficient stock or server error.");
                })
                .toBodilessEntity();
    }

    public void restoreStock(Long productId, int quantity) {
        log.info("Compensating transaction: Restoring {} units to product ID: {}", quantity, productId);
        try {
            restClient.put()
                    .uri("/{id}/restore-stock?quantity={qty}", productId, quantity)
                    .retrieve()
                    .toBodilessEntity();
        } catch (Exception e) {
            log.error("Failed to execute compensating stock restoration for product ID {}: {}", productId, e.getMessage());
        }
    }
}

