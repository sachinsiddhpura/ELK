import axios from 'axios';

// All requests route through the centralized API Gateway on port 8080
const API_BASE_URL = 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Automatically inject JWT Bearer Token into all outbound requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('shopwave_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Authentication API (routed to auth-service:8083 via Gateway)
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  register: async (customerData) => {
    const response = await apiClient.post('/auth/register', customerData);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  getDemoCredentials: async () => {
    const response = await apiClient.get('/auth/demo-credentials');
    return response.data;
  },

  // Products API (routed to product-service:8081 via Gateway)
  getProducts: async (params = {}) => {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },

  getProductCategories: async () => {
    const response = await apiClient.get('/products/categories');
    return response.data;
  },

  getProductById: async (id) => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  createProduct: async (productData) => {
    const response = await apiClient.post('/products', productData);
    return response.data;
  },

  updateProduct: async (id, productData) => {
    const response = await apiClient.put(`/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },

  // Orders API (routed to order-service:8082 via Gateway)
  getOrders: async (customerEmail) => {
    const params = customerEmail ? { customerEmail } : {};
    const response = await apiClient.get('/orders', { params });
    return response.data;
  },

  getOrderById: async (id) => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },

  placeOrder: async (orderRequest) => {
    const response = await apiClient.post('/orders', orderRequest);
    return response.data;
  },

  updateOrderStatus: async (id, status) => {
    const response = await apiClient.put(`/orders/${id}/status`, null, {
      params: { status },
    });
    return response.data;
  },

  // Payment API (routed to payment-service:8084 via Gateway)
  getPaymentMethods: async () => {
    const response = await apiClient.get('/payments/methods');
    return response.data;
  },

  getAllPayments: async () => {
    const response = await apiClient.get('/payments/all');
    return response.data;
  },

  getPaymentByOrderNumber: async (orderNumber) => {
    const response = await apiClient.get(`/payments/order/${orderNumber}`);
    return response.data;
  },

  processDirectPayment: async (paymentData) => {
    const response = await apiClient.post('/payments/process', paymentData);
    return response.data;
  },

  // Bug Simulation Endpoints (for Testing Logs & ELK Stack)
  simulateProductBug: async (type = 'npe') => {
    const response = await apiClient.get('/products/simulate-bug', { params: { type } });
    return response.data;
  },

  simulateOrderBug: async (type = 'payment') => {
    const response = await apiClient.get('/orders/simulate-bug', { params: { type } });
    return response.data;
  },

  // Microservices System Health
  getSystemHealth: async () => {
    const response = await apiClient.get('/system/health');
    return response.data;
  },
};

export default api;
