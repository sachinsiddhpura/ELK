import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Button,
  Box,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  Divider,
  Stack,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import { useCart } from '../context/CartContext';
import { api } from '../services/api';
import { formatINR } from '../utils/formatCurrency';

export default function CheckoutModal({ open, onClose, onOrderPlaced }) {
  const { cartItems, cartTotal, clearCart } = useCart();

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    shippingAddress: '',
    paymentMethod: 'UPI / GPay / PhonePe',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);

  const shipping = cartTotal > 999 ? 0 : 99;
  const tax = cartTotal * 0.18;
  const finalTotal = cartTotal + (cartTotal > 0 ? shipping + tax : 0);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerEmail || !formData.shippingAddress) {
      setError('Please fill in all required fields (Name, Email, Address)');
      return;
    }

    setLoading(true);
    setError(null);

    const orderPayload = {
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      customerPhone: formData.customerPhone,
      shippingAddress: formData.shippingAddress,
      paymentMethod: formData.paymentMethod,
      items: cartItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
    };

    try {
      const placedOrder = await api.placeOrder(orderPayload);
      setCompletedOrder(placedOrder);
      clearCart();
      if (onOrderPlaced) onOrderPlaced(placedOrder);
    } catch (err) {
      console.error('Order submission failed:', err);
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to place order in MySQL. Downstream service may be unavailable or stock is insufficient.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCompletedOrder(null);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      {completedOrder ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 72, color: 'success.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={800} gutterBottom>
            Order Placed Successfully!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Thank you, <strong>{completedOrder.customerName}</strong>. Your order has been persisted in MySQL Order Database!
          </Typography>

          <Box sx={{ bgcolor: '#f1f5f9', p: 2.5, borderRadius: 2, mb: 3, textAlign: 'left' }}>
            <Typography variant="body2" color="text.secondary">
              Order Number: <strong>{completedOrder.orderNumber}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Amount: <strong>{formatINR(completedOrder.totalAmount)}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Status: <strong>{completedOrder.status}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Shipping to: {completedOrder.shippingAddress}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Payment Method: <strong>{completedOrder.paymentMethod}</strong>
            </Typography>
          </Box>

          <Button
            variant="contained"
            fullWidth
            onClick={handleClose}
            sx={{ borderRadius: 2, py: 1.2, fontWeight: 700, textTransform: 'none' }}
          >
            Continue Shopping
          </Button>
        </Box>
      ) : (
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 800 }}>Complete Your Order (INR)</DialogTitle>
          <Divider />
          <DialogContent sx={{ p: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Typography variant="subtitle2" fontWeight={700} color="primary" sx={{ mb: 2 }}>
              1. Customer Information
            </Typography>

            <Stack spacing={2} sx={{ mb: 3 }}>
              <TextField
                required
                fullWidth
                size="small"
                label="Full Name"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  required
                  fullWidth
                  type="email"
                  size="small"
                  label="Email Address"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleChange}
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Phone / Mobile Number"
                  name="customerPhone"
                  placeholder="+91 98765 43210"
                  value={formData.customerPhone}
                  onChange={handleChange}
                />
              </Box>
              <TextField
                required
                fullWidth
                multiline
                rows={2}
                size="small"
                label="Shipping Address"
                name="shippingAddress"
                placeholder="Flat 402, Lotus Towers, MG Road, Bengaluru, Karnataka - 560001"
                value={formData.shippingAddress}
                onChange={handleChange}
              />
            </Stack>

            <Typography variant="subtitle2" fontWeight={700} color="primary" sx={{ mb: 1.5 }}>
              2. Payment Method
            </Typography>

            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <RadioGroup row name="paymentMethod" value={formData.paymentMethod} onChange={handleChange}>
                <FormControlLabel value="UPI / GPay / PhonePe" control={<Radio size="small" />} label="UPI / GPay / Paytm" />
                <FormControlLabel value="Credit / Debit Card" control={<Radio size="small" />} label="Credit / Debit Card" />
                <FormControlLabel value="Net Banking" control={<Radio size="small" />} label="Net Banking" />
                <FormControlLabel value="Cash on Delivery" control={<Radio size="small" />} label="Cash on Delivery" />
              </RadioGroup>
            </FormControl>

            <Typography variant="subtitle2" fontWeight={700} color="primary" sx={{ mb: 1 }}>
              3. Order Summary
            </Typography>

            <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 2 }}>
              <List dense disablePadding>
                {cartItems.map((item) => (
                  <ListItem key={item.product.id} disableGutters>
                    <ListItemText
                      primary={item.product.name}
                      secondary={`Qty: ${item.quantity} × ${formatINR(item.product.price)}`}
                    />
                    <Typography variant="body2" fontWeight={600}>
                      {formatINR(item.product.price * item.quantity)}
                    </Typography>
                  </ListItem>
                ))}
              </List>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  Total to Pay
                </Typography>
                <Typography variant="subtitle1" fontWeight={800} color="primary.main">
                  {formatINR(finalTotal)}
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <Divider />
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleClose} disabled={loading} sx={{ textTransform: 'none' }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading || cartItems.length === 0}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ShoppingCartCheckoutIcon />}
              sx={{
                borderRadius: 2,
                px: 3,
                fontWeight: 700,
                textTransform: 'none',
                bgcolor: '#2563eb',
              }}
            >
              {loading ? 'Processing via Gateway...' : `Place Order (${formatINR(finalTotal)})`}
            </Button>
          </DialogActions>
        </form>
      )}
    </Dialog>
  );
}
