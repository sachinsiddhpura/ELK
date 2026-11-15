package com.ecommerce.gateway.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Enumeration;
import java.util.Set;

@RestController
@RequestMapping("/api")
public class GatewayController {

    private static final Logger log = LoggerFactory.getLogger(GatewayController.class);

    private static final Set<String> RESTRICTED_HEADERS = Set.of(
            "connection", "content-length", "host", "upgrade", "keep-alive",
            "te", "trailer", "transfer-encoding", "proxy-connection", "proxy-authorization"
    );

    @Value("${services.product.url:http://localhost:8081}")
    private String productServiceUrl;

    @Value("${services.order.url:http://localhost:8082}")
    private String orderServiceUrl;

    @Value("${services.auth.url:http://localhost:8083}")
    private String authServiceUrl;

    @Value("${services.payment.url:http://localhost:8084}")
    private String paymentServiceUrl;

    private final HttpClient httpClient;

    public GatewayController() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    @RequestMapping(value = "/auth/**")
    public ResponseEntity<byte[]> routeAuth(HttpServletRequest request, @RequestBody(required = false) byte[] body) {
        return forwardRequest(authServiceUrl, request, body);
    }

    @RequestMapping(value = "/payments/**")
    public ResponseEntity<byte[]> routePayments(HttpServletRequest request, @RequestBody(required = false) byte[] body) {
        return forwardRequest(paymentServiceUrl, request, body);
    }

    @RequestMapping(value = "/products/**")
    public ResponseEntity<byte[]> routeProducts(HttpServletRequest request, @RequestBody(required = false) byte[] body) {
        return forwardRequest(productServiceUrl, request, body);
    }

    @RequestMapping(value = "/orders/**")
    public ResponseEntity<byte[]> routeOrders(HttpServletRequest request, @RequestBody(required = false) byte[] body) {
        return forwardRequest(orderServiceUrl, request, body);
    }

    private ResponseEntity<byte[]> forwardRequest(String targetBaseUrl, HttpServletRequest request, byte[] body) {
        String requestUri = request.getRequestURI();
        String queryString = request.getQueryString();
        String targetUrl = targetBaseUrl + requestUri + (queryString != null ? "?" + queryString : "");

        String method = request.getMethod();

        // Inject MDC for Structured JSON Logging in ELK
        MDC.put("httpMethod", method);
        MDC.put("requestUri", requestUri);
        MDC.put("targetService", targetBaseUrl);
        MDC.put("clientIp", request.getRemoteAddr());

        try {
            log.info("[GATEWAY ROUTE] {} {} -> {}", method, requestUri, targetUrl);

            HttpRequest.Builder reqBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(targetUrl))
                    .timeout(Duration.ofSeconds(10));

            // Copy only safe headers
            Enumeration<String> headerNames = request.getHeaderNames();
            if (headerNames != null) {
                while (headerNames.hasMoreElements()) {
                    String headerName = headerNames.nextElement();
                    if (!RESTRICTED_HEADERS.contains(headerName.toLowerCase())) {
                        try {
                            reqBuilder.header(headerName, request.getHeader(headerName));
                        } catch (IllegalArgumentException ignored) {
                        }
                    }
                }
            }

            // Set method & body
            if (body != null && body.length > 0) {
                reqBuilder.method(method, HttpRequest.BodyPublishers.ofByteArray(body));
            } else if ("POST".equalsIgnoreCase(method) || "PUT".equalsIgnoreCase(method) || "PATCH".equalsIgnoreCase(method)) {
                reqBuilder.method(method, HttpRequest.BodyPublishers.noBody());
            } else {
                reqBuilder.method(method, HttpRequest.BodyPublishers.noBody());
            }

            HttpResponse<byte[]> response = httpClient.send(reqBuilder.build(), HttpResponse.BodyHandlers.ofByteArray());

            HttpHeaders responseHeaders = new HttpHeaders();
            response.headers().map().forEach((k, v) -> {
                if (!k.equalsIgnoreCase("transfer-encoding") && !k.equalsIgnoreCase("content-length")) {
                    responseHeaders.put(k, v);
                }
            });

            return new ResponseEntity<>(response.body(), responseHeaders, HttpStatus.valueOf(response.statusCode()));

        } catch (IOException | InterruptedException e) {
            log.error("[GATEWAY ERROR] Failed to forward request to {}: {}", targetUrl, e.getMessage());
            String errorJson = String.format("{\"error\": \"Gateway unable to connect to downstream service\", \"target\": \"%s\", \"message\": \"%s\"}",
                    targetUrl, e.getMessage());
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            return new ResponseEntity<>(errorJson.getBytes(), headers, HttpStatus.BAD_GATEWAY);
        } finally {
            MDC.clear();
        }
    }
}
