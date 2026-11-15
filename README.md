# ShopWave - Enterprise E-Commerce Microservices

A modern, full-stack E-Commerce application built with **Spring Boot 3 / 4 (Java 21)** microservices architecture, **MySQL Database**, and a **React 19 + Material-UI (MUI)** frontend with **Indian Rupee (₹ / INR)** pricing.

---

## 🏛️ Microservices Architecture

```
                    ┌─────────────────────────┐
                    │  React + Material UI    │
                    │   (Vite - Port 5173)    │
                    │  INR (₹) Currency Mode  │
                    └────────────┬────────────┘
                                 │ HTTP / JSON
                                 ▼
                    ┌─────────────────────────┐
                    │       API Gateway       │
                    │       (Port 8080)       │
                    │  Reverse Proxy & CORS   │
                    └────────┬───────────┬────┘
           /api/products/**  │           │  /api/orders/**
                             ▼           ▼
             ┌──────────────────┐     ┌──────────────────┐
             │ Product Service  │◄────┤  Order Service   │
             │   (Port 8081)    │HTTP │   (Port 8082)    │
             │  MySQL Database  │Deduct  MySQL Database  │
             │ecommerce_prod_db │Stock ecommerce_order_db│
             └────────┬─────────┘     └────────┬─────────┘
                      │                        │
                      ▼                        ▼
         ┌────────────────────────────────────────────────┐
         │             MySQL Database Server              │
         │  Port 3306 • User: root • Password: RooT12     │
         └────────────────────────────────────────────────┘
```

### 1. `api-gateway` (Port `8080`)
- Central entry point and reverse proxy for all client traffic.
- Unifies CORS headers across all frontend environments.
- Routes `/api/products/**` to `product-service:8081`.
- Routes `/api/orders/**` to `order-service:8082`.
- Provides an aggregated cluster health monitor at `/api/system/health`.
- Structured logging ready for ELK Stack ingestion.

### 2. `product-service` (Port `8081`)
- **Database:** MySQL `ecommerce_product_db` on `localhost:3306`.
- Product catalog management, categories, search, pricing in **INR (₹)**, and stock levels.
- Pre-seeded with tech products (e.g. Sony WH-1000XM5 at ₹29,990, MacBook Pro at ₹1,69,900).
- Exposes transactional inventory deduction API (`PUT /api/products/{id}/deduct-stock?quantity=N`).

### 3. `order-service` (Port `8082`)
- **Database:** MySQL `ecommerce_order_db` on `localhost:3306`.
- Handles order placement in **INR (₹)**, customer checkout, and order status lifecycle.
- **Inter-service communication:** Uses Spring's modern fluent `RestClient` to query `product-service`, verify stock availability, and reserve/deduct stock upon checkout.
- Order tracking and status management (`PENDING`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, `CANCELLED`).

### 4. `frontend` (Port `5173`)
- **React 19** powered by **Vite** and styled with **Material-UI (MUI)**.
- **INR (₹) Formatting:** Formats prices in Indian numbering standards (`Intl.NumberFormat('en-IN')`).
- **Storefront:** Category filters, full-text search, responsive product cards, rating badges, real-time stock counters.
- **Shopping Cart:** Slide-in Drawer with real-time 18% GST, shipping calculation, and quantity controls.
- **Checkout Modal:** Customer details, shipping address, Indian payment options (UPI / GPay / Paytm, Cards, Net Banking, COD).
- **Order Tracking:** Live order history with expandable purchased items and admin status updates.
- **Catalog Management:** Add, edit, and delete products directly in MySQL from the UI.
- **System Status Dashboard:** Real-time visual health check of all microservices, MySQL database, and gateway.

---

## 🗄️ MySQL Database Credentials

| Property | Value |
|---|---|
| **Host** | `localhost:3306` |
| **Username** | `root` |
| **Password** | `RooT12` |
| **Product Database** | `ecommerce_product_db` (Auto-created) |
| **Order Database** | `ecommerce_order_db` (Auto-created) |

---

## 🚀 Quick Start (Windows)

### Option 1: One-Click Startup Script
Double-click or run:
```cmd
start-all.bat
```
This opens 4 dedicated terminal windows running:
- Product Service (`http://localhost:8081`)
- Order Service (`http://localhost:8082`)
- API Gateway (`http://localhost:8080`)
- Frontend UI (`http://localhost:5173`)

To stop all running services:
```cmd
stop-all.bat
```

---

### Option 2: Running Services Manually

#### Step 1: Start Product Service (Terminal 1)
```powershell
cd product-service
.\mvnw.cmd spring-boot:run
```

#### Step 2: Start Order Service (Terminal 2)
```powershell
cd order-service
.\mvnw.cmd spring-boot:run
```

#### Step 3: Start API Gateway (Terminal 3)
```powershell
cd api-gateway
.\mvnw.cmd spring-boot:run
```

#### Step 4: Start Frontend UI (Terminal 4)
```powershell
cd frontend
npm.cmd run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser!

---

## 📡 REST API Reference (via API Gateway - `8080`)

### Product Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/products` | List all products in INR (supports `?category=Electronics&search=Sony`) |
| `GET` | `/api/products/categories` | List distinct product categories |
| `GET` | `/api/products/{id}` | Get product details by ID |
| `POST` | `/api/products` | Create a new product in MySQL |
| `PUT` | `/api/products/{id}` | Update product information |
| `DELETE` | `/api/products/{id}` | Delete product from catalog |
| `PUT` | `/api/products/{id}/deduct-stock?quantity=N` | Atomically decrement stock in MySQL |

### Order Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/orders` | List all orders from MySQL (newest first) |
| `GET` | `/api/orders/{id}` | Get order details by ID |
| `GET` | `/api/orders/track/{orderNumber}` | Track order by order number |
| `POST` | `/api/orders` | Place order in INR (deducts stock from product service) |
| `PUT` | `/api/orders/{id}/status?status=SHIPPED` | Update order status |

### System & Health Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/system/health` | Aggregated health check for Gateway, Product, and Order services |

---

## 📦 Sample Order Request (`POST /api/orders`)
```json
{
  "customerName": "Vikram Sharma",
  "customerEmail": "vikram.sharma@example.com",
  "customerPhone": "+91 98765 43210",
  "shippingAddress": "Flat 502, Prestige Palms, Whitefield, Bengaluru - 560066",
  "paymentMethod": "UPI / GPay / PhonePe",
  "items": [
    { "productId": 1, "quantity": 1 },
    { "productId": 3, "quantity": 1 }
  ]
}
```


---

## 🪵 Logging Architecture (logback-spring.xml)

Every microservice includes a dedicated, production-ready `logback-spring.xml`:
- **Colored Console Appender:** Color-coded for high visibility in development terminals (`[SERVICE_NAME]`, `[Port]`, `Timestamp`, `Logger`).
- **Rolling File Appender:** Saved to `logs/${APP_NAME}.log` with daily rotation and gzip compression (`archived/${APP_NAME}-%d{yyyy-MM-dd}.%i.log.gz`).
- **Dedicated Error Appender:** Errors filtered into `logs/${APP_NAME}-error.log` for instant anomaly detection.
- **ELK Stack / Filebeat Ready:** Structured format parsed seamlessly by Logstash grok patterns or Elasticsearch ingest pipelines.

Active log directories:
- `product-service/logs/product-service.log`
- `order-service/logs/order-service.log`
- `api-gateway/logs/api-gateway.log`


---

## 🐞 Injected Bug Scenarios & Log Testing Guide

Simulated bugs have been added across both microservices to test and verify Logback error isolation and ELK pipeline ingestion.

### 1. Product Service Bugs (Port 8081)
| Trigger Endpoint | Bug Type | Generated Log Message | Log Destination |
|---|---|---|---|
| `GET /api/products/simulate-bug?type=npe` | NullPointerException | `[ERROR] [NPE BUG] Dereferencing null pointer in ProductPricingEngine context!` | `product-service-error.log` |
| `GET /api/products/simulate-bug?type=deadlock` | MySQL Deadlock | `[ERROR] [DB ERROR] MySQL Deadlock detected: LockAcquisitionException (Error Code 1213)` | `product-service-error.log` |
| `GET /api/products/simulate-bug?type=arithmetic` | Division by Zero | `[ERROR] [CALCULATION ERROR] Product discount ratio calculation crashed with divisor zero` | `product-service-error.log` |
| `GET /api/products/999` | Corrupt Cache Record | `[ERROR] [CRITICAL BUG] Product cache pointer is corrupt for product ID: 999` | `product-service-error.log` |

### 2. Order Service Bugs (Port 8082)
| Trigger Endpoint | Bug Type | Generated Log Message | Log Destination |
|---|---|---|---|
| `GET /api/orders/simulate-bug?type=payment` | Payment Gateway 504 | `[ERROR] [PAYMENT ERROR] PaymentGatewayException: Bank rejected transaction code 504` | `order-service-error.log` |
| `GET /api/orders/simulate-bug?type=inter-service` | Circuit Breaker Failure | `[ERROR] [INTER-SERVICE ERROR] ProductClientException: Downstream Product Service returned HTTP 503` | `order-service-error.log` |
| `GET /api/orders/simulate-bug?type=inventory-leak` | State Inconsistency | `[ERROR] [DATA CORRUPTION] Critical anomaly detected: Order line-item reservation mismatch!` | `order-service-error.log` |
| `GET /api/orders/simulate-bug?type=npe` | Invoice Rendering NPE | `[ERROR] [NPE BUG] Null order dispatch invoice strategy found in OrderWorkflowContext` | `order-service-error.log` |

### 3. One-Click UI Testing
Open the frontend at **http://localhost:5173**, navigate to the **System Status** tab, and click any of the buttons under **"Bug Simulation & Logback Diagnostics Console"**. The results will immediately show the log target path and error details.
