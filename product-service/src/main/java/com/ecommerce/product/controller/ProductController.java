package com.ecommerce.product.controller;

import com.ecommerce.product.model.Product;
import com.ecommerce.product.service.ProductService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    private static final Logger log = LoggerFactory.getLogger(ProductController.class);

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search) {
        log.info("Fetching products catalog - category: {}, search: {}", category, search);
        return ResponseEntity.ok(productService.getAllProducts(category, search));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        return ResponseEntity.ok(productService.getAllCategories());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProductById(@PathVariable Long id) {
        MDC.put("productId", String.valueOf(id));
        try {
            log.info("Querying product ID: {}", id);

            // INTENTIONAL BUG 1: Trigger NullPointerException when ID is 999
            if (id == 999L) {
                log.error("[CRITICAL BUG] Product cache pointer is corrupt for product ID: 999");
                String nullPointerBug = null;
                nullPointerBug.toUpperCase();
            }

            return productService.getProductById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } finally {
            MDC.remove("productId");
        }
    }

    @PostMapping
    public ResponseEntity<?> createProduct(@Valid @RequestBody Product product) {
        log.info("Attempting to create product: {}", product.getName());

        // INTENTIONAL BUG 2: Validation check failure with Error Log
        if (product.getName() != null && product.getName().toLowerCase().contains("crash")) {
            log.error("[FATAL ERROR] Malicious payload detected in product name: {}. Aborting transaction.", product.getName());
            throw new IllegalArgumentException("Rejected product creation: Payload name triggered security violation rule #403");
        }

        Product created = productService.createProduct(product);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable Long id, @Valid @RequestBody Product product) {
        try {
            Product updated = productService.updateProduct(id, product);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Failed to update product ID {}: {}", id, e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id) {
        try {
            productService.deleteProduct(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Product deleted successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error deleting product ID {}: {}", id, e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    @PutMapping("/{id}/deduct-stock")
    public ResponseEntity<?> deductStock(@PathVariable Long id, @RequestParam int quantity) {
        log.info("Request received to deduct {} stock units for product ID: {}", quantity, id);

        // INTENTIONAL BUG 3: Arithmetic division by zero if quantity is 999
        if (quantity == 999) {
            log.warn("[WARNING] High quantity request ({}) triggered inventory ratio recalculation", quantity);
            int zero = 0;
            int bug = 100 / zero; // Triggers java.lang.ArithmeticException: / by zero
        }

        try {
            Product product = productService.deductStock(id, quantity);
            return ResponseEntity.ok(product);
        } catch (RuntimeException e) {
            log.error("Stock deduction failed for product ID {}: {}", id, e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    @PutMapping("/{id}/restore-stock")
    public ResponseEntity<?> restoreStock(@PathVariable Long id, @RequestParam int quantity) {
        log.info("Request received to restore {} stock units for product ID: {}", quantity, id);
        try {
            Product product = productService.restoreStock(id, quantity);
            return ResponseEntity.ok(product);
        } catch (RuntimeException e) {
            log.error("Stock restoration failed for product ID {}: {}", id, e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        }
    }

    /**
     * DEDICATED BUG SIMULATION ENDPOINT FOR TESTING LOGBACK & ELK LOGS
     * Supports: 'npe', 'deadlock', 'arithmetic', 'timeout'
     */
    @GetMapping("/simulate-bug")
    public ResponseEntity<?> simulateBug(@RequestParam(defaultValue = "npe") String type) {
        log.warn("[BUG TEST] Inbound bug simulation requested with type='{}'", type);

        switch (type.toLowerCase()) {
            case "deadlock":
                log.warn("[DB WARNING] High row contention on table 'products' across transactions T1 and T2");
                log.error("[DB ERROR] MySQL Deadlock detected: org.hibernate.exception.LockAcquisitionException: " +
                        "Deadlock found when trying to get lock; try restarting transaction",
                        new SQLException("Deadlock found when trying to get lock; try restarting transaction", "40001", 1213));
                throw new RuntimeException("Simulated Database Deadlock in MySQL ecommerce_product_db (Error Code: 1213)");

            case "arithmetic":
                log.error("[CALCULATION ERROR] Product discount ratio calculation crashed with divisor zero");
                int a = 100, b = 0;
                int res = a / b;
                return ResponseEntity.ok(res);

            case "timeout":
                log.error("[NETWORK TIMEOUT] Remote supplier inventory feed timed out after 30000ms: ConnectException: Connection refused: no further information");
                throw new RuntimeException("Simulated External Supplier Feed Timeout Exception");

            case "npe":
            default:
                log.error("[NPE BUG] Dereferencing null pointer in ProductPricingEngine context!");
                String npe = null;
                npe.toLowerCase(); // Generates java.lang.NullPointerException
                return ResponseEntity.ok("Unreachable");
        }
    }
}
