import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  Button,
  MenuItem,
  Select,
  FormControl,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { api } from '../services/api';
import { formatINR } from '../utils/formatCurrency';

const statusConfig = {
  PENDING: { color: 'warning', icon: <HourglassEmptyIcon fontSize="small" /> },
  CONFIRMED: { color: 'info', icon: <CheckCircleIcon fontSize="small" /> },
  SHIPPED: { color: 'primary', icon: <LocalShippingIcon fontSize="small" /> },
  DELIVERED: { color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  CANCELLED: { color: 'error', icon: <CancelOutlinedIcon fontSize="small" /> },
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders', err);
      setError('Could not connect to Order Service via Gateway. Please check if services are running with MySQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const updated = await api.updateOrderStatus(orderId, newStatus);
      setOrders((prev) => prev.map((ord) => (ord.id === orderId ? updated : ord)));
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Order Tracking & History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Live order data persisted in MySQL (<code>ecommerce_order_db</code>)
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchOrders}
          disabled={loading}
          sx={{ borderRadius: 2, textTransform: 'none' }}
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : orders.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center', borderRadius: 3, bgcolor: '#f8fafc' }}>
          <LocalShippingIcon sx={{ fontSize: 56, color: '#cbd5e1', mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} color="text.secondary">
            No orders placed yet in MySQL database
          </Typography>
          <Typography variant="body2" color="text.disabled">
            Place an order from the Storefront in INR (₹) to see it stored and tracked here!
          </Typography>
        </Card>
      ) : (
        <Stack spacing={2.5}>
          {orders.map((order) => {
            const conf = statusConfig[order.status] || { color: 'default', icon: null };
            return (
              <Card
                key={order.id}
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.2s ease',
                  '&:hover': { boxShadow: '0 8px 20px -6px rgba(0,0,0,0.08)' },
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    bgcolor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1.5,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800} color="primary.main">
                      {order.orderNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Placed on: {new Date(order.orderDate).toLocaleString()} • Customer: {order.customerName} ({order.customerEmail})
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Chip
                      label={order.status}
                      color={conf.color}
                      icon={conf.icon}
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />

                    <FormControl size="small" sx={{ minWidth: 130 }}>
                      <Select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updatingId === order.id}
                        sx={{ fontSize: '0.8rem', height: 32 }}
                      >
                        <MenuItem value="PENDING">PENDING</MenuItem>
                        <MenuItem value="CONFIRMED">CONFIRMED</MenuItem>
                        <MenuItem value="SHIPPED">SHIPPED</MenuItem>
                        <MenuItem value="DELIVERED">DELIVERED</MenuItem>
                        <MenuItem value="CANCELLED">CANCELLED</MenuItem>
                      </Select>
                    </FormControl>
                  </Stack>
                </Box>

                <CardContent sx={{ p: 2.5 }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                    Purchased Items
                  </Typography>

                  <TableContainer component={Paper} elevation={0} sx={{ bgcolor: '#fafafa', border: '1px solid #f1f5f9', mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Price</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Qty</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>Subtotal</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {order.items?.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell align="right">{formatINR(item.unitPrice)}</TableCell>
                            <TableCell align="center">{item.quantity}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>{formatINR(item.subtotal)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      Shipping to: <strong>{order.shippingAddress}</strong> • Payment: <strong>{order.paymentMethod}</strong>
                    </Typography>
                    <Typography variant="h6" fontWeight={800} color="primary.main">
                      Total: {formatINR(order.totalAmount)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}
