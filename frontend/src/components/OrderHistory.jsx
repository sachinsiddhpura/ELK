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
  TextField,
  InputAdornment,
  Divider,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import LockPersonIcon from '@mui/icons-material/LockPerson';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import { api } from '../services/api';
import { formatINR } from '../utils/formatCurrency';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

const statusConfig = {
  PENDING: { color: 'warning', icon: <HourglassEmptyIcon fontSize="small" /> },
  CONFIRMED: { color: 'info', icon: <CheckCircleIcon fontSize="small" /> },
  SHIPPED: { color: 'primary', icon: <LocalShippingIcon fontSize="small" /> },
  DELIVERED: { color: 'success', icon: <CheckCircleIcon fontSize="small" /> },
  CANCELLED: { color: 'error', icon: <CancelOutlinedIcon fontSize="small" /> },
};

export default function OrderHistory() {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  // Auth Modal trigger
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState(0);

  // Guest Order Tracking state
  const [trackNumber, setTrackNumber] = useState('');
  const [trackEmail, setTrackEmail] = useState('');
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackError, setTrackError] = useState(null);
  const [trackLoading, setTrackLoading] = useState(false);

  const fetchOrders = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);
    try {
      // Admin gets all orders; Customer queries strictly their own email
      const filterEmail = !isAdmin && user?.email ? user.email : undefined;
      const data = await api.getOrders(filterEmail);
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders', err);
      setError(err.response?.data?.error || 'Unable to retrieve orders from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders();
    } else {
      setOrders([]);
    }
  }, [isAuthenticated, isAdmin, user?.email]);

  const handleStatusChange = async (orderId, newStatus) => {
    if (!isAdmin) {
      alert('Unauthorized: Only administrators can update order status.');
      return;
    }
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

  const handleTrackSingleOrder = async (e) => {
    e.preventDefault();
    if (!trackNumber.trim()) {
      setTrackError('Please enter an Order Number (e.g. ORD-...)');
      return;
    }

    setTrackLoading(true);
    setTrackError(null);
    setTrackedOrder(null);

    try {
      // In Gateway / api, track by orderNumber and email
      const res = await api.getOrderById(trackNumber.trim());
      setTrackedOrder(res);
    } catch (err) {
      console.error('Track order failed:', err);
      setTrackError('Order not found or billing email did not match. Please verify your order number.');
    } finally {
      setTrackLoading(false);
    }
  };

  // IF USER IS NOT LOGGED IN: Render WooCommerce Protected Screen
  if (!isAuthenticated) {
    return (
      <Box sx={{ maxWidth: 850, mx: 'auto', py: 4 }}>
        <Card elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #e2e8f0', textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <LockPersonIcon sx={{ fontSize: 36, color: '#2563eb' }} />
          </Box>

          <Typography variant="h5" fontWeight={800} gutterBottom>
            Sign In to View Your Orders
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 540, mx: 'auto', mb: 3.5 }}>
            In accordance with standard WooCommerce customer privacy policies, order history is private. Please sign in to view your past purchases, shipment statuses, and invoices.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ maxWidth: 450, mx: 'auto' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<LoginIcon />}
              onClick={() => {
                setAuthTab(0);
                setAuthOpen(true);
              }}
              sx={{ py: 1.2, px: 3, borderRadius: 2, fontWeight: 700, textTransform: 'none', bgcolor: '#2563eb' }}
            >
              Sign In (1-Click Demo)
            </Button>

            <Button
              variant="outlined"
              size="large"
              startIcon={<PersonAddIcon />}
              onClick={() => {
                setAuthTab(1);
                setAuthOpen(true);
              }}
              sx={{ py: 1.2, px: 3, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
            >
              Register Customer Account
            </Button>
          </Stack>
        </Card>

        {/* WooCommerce Guest Order Tracking Tool */}
        <Card elevation={0} sx={{ p: 3.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
          <Typography variant="subtitle1" fontWeight={800} gutterBottom>
            📦 Track an Order (Guest Lookup)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            To track your delivery without logging in, enter your Order Number below.
          </Typography>

          {trackError && (
            <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
              {trackError}
            </Alert>
          )}

          <form onSubmit={handleTrackSingleOrder}>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <TextField
                required
                size="small"
                label="Order Number"
                placeholder="e.g. ORD-2611151113-9769"
                value={trackNumber}
                onChange={(e) => setTrackNumber(e.target.value)}
                sx={{ flexGrow: 1, minWidth: 240, bgcolor: 'white' }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={trackLoading}
                startIcon={trackLoading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
                sx={{ borderRadius: 2, px: 3, fontWeight: 700, textTransform: 'none', bgcolor: '#0f172a' }}
              >
                Track Order
              </Button>
            </Box>
          </form>

          {trackedOrder && (
            <Box sx={{ mt: 3, p: 2.5, bgcolor: 'white', borderRadius: 2, border: '1px solid #cbd5e1' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle1" fontWeight={800} color="primary">
                  Order #{trackedOrder.orderNumber}
                </Typography>
                <Chip
                  label={trackedOrder.status}
                  color={statusConfig[trackedOrder.status]?.color || 'default'}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Placed by: <strong>{trackedOrder.customerName}</strong> • Total: <strong>{formatINR(trackedOrder.totalAmount)}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Shipping Address: {trackedOrder.shippingAddress}
              </Typography>
            </Box>
          )}
        </Card>

        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          defaultTab={authTab}
        />
      </Box>
    );
  }

  // IF AUTHENTICATED: Render orders list
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h5" fontWeight={800}>
              {isAdmin ? 'WooCommerce Orders Manager (Admin Console)' : 'My Orders'}
            </Typography>
            {isAdmin ? (
              <Chip
                icon={<AdminPanelSettingsIcon style={{ fontSize: 14, color: '#f3e8ff' }} />}
                label="Admin Full View"
                size="small"
                sx={{ bgcolor: '#7c3aed', color: 'white', fontWeight: 800 }}
              />
            ) : (
              <Chip
                icon={<PersonIcon style={{ fontSize: 14, color: '#0369a1' }} />}
                label={`Customer: ${user.name}`}
                size="small"
                sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 700 }}
              />
            )}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {isAdmin
              ? 'Administrator privilege: inspect all customer orders and update dispatch statuses in MySQL'
              : `Showing your verified orders from MySQL (${user.email})`}
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
        <Card elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed #cbd5e1' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No orders found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isAdmin
              ? 'No orders recorded in MySQL database.'
              : `You haven't placed any orders yet with ${user.email}. Head to the Storefront to start shopping!`}
          </Typography>
        </Card>
      ) : (
        <Stack spacing={2.5}>
          {orders.map((order) => {
            const statusInfo = statusConfig[order.status] || { color: 'default', icon: null };
            return (
              <Card
                key={order.id}
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  transition: 'box-shadow 0.2s ease',
                  '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
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
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800} color="primary">
                      {order.orderNumber}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Placed on: {new Date(order.orderDate).toLocaleString('en-IN')} • Customer:{' '}
                      <strong>{order.customerName}</strong> ({order.customerEmail})
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Chip
                      icon={statusInfo.icon}
                      label={order.status}
                      color={statusInfo.color}
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />

                    {/* ONLY ADMIN CAN CHANGE ORDER STATUS */}
                    {isAdmin && (
                      <FormControl size="small" sx={{ minWidth: 140 }}>
                        <Select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          disabled={updatingId === order.id}
                          sx={{ fontSize: '0.8rem', height: 32, bgcolor: '#ffffff', borderRadius: 1.5 }}
                        >
                          <MenuItem value="PENDING">PENDING</MenuItem>
                          <MenuItem value="CONFIRMED">CONFIRMED</MenuItem>
                          <MenuItem value="SHIPPED">SHIPPED</MenuItem>
                          <MenuItem value="DELIVERED">DELIVERED</MenuItem>
                          <MenuItem value="CANCELLED">CANCELLED</MenuItem>
                        </Select>
                      </FormControl>
                    )}
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
