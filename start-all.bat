@echo off
echo ===================================================
echo   Starting ShopWave E-Commerce Microservices
echo ===================================================

echo [1/5] Starting Auth Service (Port 8083)...
start "Auth Service [8083]" cmd /k "cd auth-service && mvnw.cmd spring-boot:run"

echo [2/5] Starting Product Service (Port 8081)...
start "Product Service [8081]" cmd /k "cd product-service && mvnw.cmd spring-boot:run"

echo [3/6] Starting Order Service (Port 8082)...
start "Order Service [8082]" cmd /k "cd order-service && mvnw.cmd spring-boot:run"

echo [4/6] Starting Payment Service (Port 8084)...
start "Payment Service [8084]" cmd /k "cd payment-service && mvnw.cmd spring-boot:run"

echo [5/6] Starting API Gateway (Port 8080)...
start "API Gateway [8080]" cmd /k "cd api-gateway && mvnw.cmd spring-boot:run"

echo [6/6] Starting React MUI Frontend (Port 5173)...
start "Frontend React MUI [5173]" cmd /k "cd frontend && npm.cmd run dev"

echo.
echo All microservices and frontend launched in separate windows!
echo - API Gateway:      http://localhost:8080
echo - Auth Service:     http://localhost:8083 (JWT + Role Auth)
echo - Product Service:  http://localhost:8081
echo - Order Service:    http://localhost:8082
echo - Payment Service:  http://localhost:8084 (UPI, Card, NetBanking, COD, Wallets)
echo - Frontend UI:      http://localhost:5173
echo ===================================================
pause

