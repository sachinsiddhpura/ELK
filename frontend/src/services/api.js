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

export const api = {
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
  getOrders: async () => {
    const response = await apiClient.get('/orders');
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

