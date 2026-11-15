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
  Select,
  MenuItem,
  InputLabel,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout';
import BugReportIcon from '@mui/icons-material/BugReport';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import LockPersonIcon from '@mui/icons-material/LockPerson';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { formatINR } from '../utils/formatCurrency';
import AuthModal from './AuthModal';

export default function CheckoutModal({ open, onClose, onOrderPlaced }) {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();

  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState(0);

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    shippingAddress: '',
  });

  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState('UPI');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [selectedWallet, setSelectedWallet] = useState('Paytm');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Fetch dynamic payment methods from payment-service (Port 8084)
  React.useEffect(() => {
    if (open) {
      api.getPaymentMethods()
        .then((data) => {
          if (data && data.methods && data.methods.length > 0) {
            setPaymentMethods(data.methods);
            setSelectedMethod(data.methods[0].method);
          }
        })
        .catch((err) => {
          console.warn('Could not fetch dynamic payment methods from payment-service, using defaults:', err);
          setPaymentMethods([
            { method: 'UPI', name: 'UPI / QR Code', description: 'Google Pay, PhonePe, Paytm, BHIM' },
            { method: 'CREDIT_CARD', name: 'Credit Card', description: 'Visa, MasterCard, RuPay, Amex' },
            { method: 'DEBIT_CARD', name: 'Debit Card', description: 'All Indian Bank Debit Cards' },
            { method: 'NET_BANKING', name: 'Net Banking', description: 'SBI, HDFC, ICICI, Axis & 50+ Banks' },
            { method: 'CASH_ON_DELIVERY', name: 'Cash on Delivery', description: 'Pay cash upon delivery at your door' },
            { method: 'WALLET', name: 'Digital Wallets', description: 'Paytm Wallet, Amazon Pay, PhonePe' },
          ]);
        });
    }
  }, [open]);

  // Pre-fill user data when modal opens and user is logged in
  React.useEffect(() => {
    if (open && isAuthenticated && user) {
      setFormData((prev) => ({
        ...prev,
        customerName: user.name || prev.customerName,
        customerEmail: user.email || prev.customerEmail,
        customerPhone: user.phone || prev.customerPhone,
        shippingAddress: user.address || prev.shippingAddress,
      }));
    }
  }, [open, isAuthenticated, user]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [simulateError, setSimulateError] = useState('none');

  const shipping = cartTotal > 999 ? 0 : 99;
  const tax = cartTotal * 0.18;
  const finalTotal = cartTotal + (cartTotal > 0 ? shipping + tax : 0);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const getResolvedPaymentDetails = () => {
    switch (selectedMethod) {
      case 'UPI':
        return paymentDetails || `${formData.customerEmail.split('@')[0] || 'customer'}@okhdfcbank`;
      case 'NET_BANKING':
        return selectedBank;
      case 'WALLET':
        return selectedWallet;
      case 'CREDIT_CARD':
      case 'DEBIT_CARD':
        return cardNumber ? `Card ending ${cardNumber.slice(-4)}` : 'Card 4242-XXXX-XXXX-4242';
      case 'CASH_ON_DELIVERY':
        return 'Pre-booked with courier AWB tracking';
      default:
        return paymentDetails || 'Online Payment';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerEmail || !formData.shippingAddress) {
      setError({
        title: 'Validation Error',
        detail: 'Please fill in all required customer details (Name, Email, Address)',
      });
      return;
    }

    setLoading(true);
    setError(null);

    const orderPayload = {
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      customerPhone: formData.customerPhone,
      shippingAddress: formData.shippingAddress,
      paymentMethod: selectedMethod,
      paymentDetails: getResolvedPaymentDetails(),
      simulateError: simulateError,
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
      console.error('Order submission blocked due to error:', err);
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Order placement failed. Downstream service reported an error.';

      // DO NOT GO FORWARD: completedOrder is NOT set, clearCart() is NOT called.
      setError({
        title: 'Order Flow Blocked — Order NOT Placed',
        detail: errMsg,
        status: err.response?.status || 500,
        logNote: 'Structured JSON error log has been written to order-service/logs/order-service-json.log',
      });
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
            {completedOrder.transactionId && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Transaction ID: <strong style={{ color: '#059669', wordBreak: 'break-all' }}>{completedOrder.transactionId}</strong>
              </Typography>
            )}
            {completedOrder.paymentStatus && (
              <Typography variant="body2" color="text.secondary">
                Payment Status: <Chip label={completedOrder.paymentStatus} size="small" color="success" sx={{ height: 20, fontSize: '0.72rem', fontWeight: 700 }} />
              </Typography>
            )}
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
      ) : !isAuthenticated ? (
        /* WOOCOMMERCE CHECKOUT POLICY: Login Required to Place Order */
        <Box sx={{ p: 4, textAlign: 'center' }}>
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
            Sign In Required to Checkout
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420, mx: 'auto', mb: 3 }}>
            In accordance with standard WooCommerce policy, you must be signed in to your customer account to place an order and link it to your profile.
          </Typography>

          <Box sx={{ bgcolor: '#f8fafc', p: 2.5, borderRadius: 2.5, mb: 3.5, border: '1px solid #e2e8f0', textAlign: 'left' }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
              Order Summary ({cartItems.length} items)
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Total Payable (inc. GST):
              </Typography>
              <Typography variant="h6" fontWeight={800} color="primary.main">
                {formatINR(finalTotal)}
              </Typography>
            </Box>
          </Box>

          <Stack spacing={1.5}>
            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={<LoginIcon />}
              onClick={() => {
                setAuthTab(0);
                setAuthOpen(true);
              }}
              sx={{ py: 1.3, borderRadius: 2, fontWeight: 700, textTransform: 'none', bgcolor: '#2563eb' }}
            >
              Sign In to Place Order (1-Click Demo)
            </Button>

            <Button
              variant="outlined"
              fullWidth
              startIcon={<PersonAddIcon />}
              onClick={() => {
                setAuthTab(1);
                setAuthOpen(true);
              }}
              sx={{ py: 1.2, borderRadius: 2, fontWeight: 700, textTransform: 'none' }}
            >
              Register as New Customer
            </Button>

            <Button onClick={handleClose} sx={{ color: 'text.secondary', textTransform: 'none', pt: 1 }}>
              Continue Browsing Store
            </Button>
          </Stack>
        </Box>
      ) : (
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: 800 }}>Complete Your Order (INR)</DialogTitle>
          <Divider />
          <DialogContent sx={{ p: 3 }}>
            {error && (
              <Alert
                severity="error"
                icon={<ErrorOutlinedIcon fontSize="inherit" />}
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  border: '1px solid #fecaca',
                  bgcolor: '#fff5f5',
                  color: '#991b1b',
                }}
              >
                <Typography variant="subtitle2" fontWeight={800}>
                  {error.title || 'Error'}
                </Typography>
                <Typography variant="body2" sx={{ my: 0.5 }}>
                  {error.detail || error}
                </Typography>
                {error.logNote && (
                  <Typography variant="caption" sx={{ display: 'block', color: '#b91c1c', mt: 0.5, fontStyle: 'italic' }}>
                    📄 {error.logNote}
                  </Typography>
                )}
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
              2. Payment Method (Dynamic via payment-service:8084)
            </Typography>

            <Box sx={{ mb: 2.5 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 1, mb: 2 }}>
                {paymentMethods.map((pm) => {
                  const isSelected = selectedMethod === pm.method;
                  return (
                    <Box
                      key={pm.method}
                      onClick={() => setSelectedMethod(pm.method)}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        bgcolor: isSelected ? '#eff6ff' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                        '&:hover': { borderColor: '#93c5fd', bgcolor: '#f8fafc' },
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
                        {pm.method === 'UPI' && <QrCode2Icon color={isSelected ? 'primary' : 'action'} />}
                        {(pm.method === 'CREDIT_CARD' || pm.method === 'DEBIT_CARD') && <CreditCardIcon color={isSelected ? 'primary' : 'action'} />}
                        {pm.method === 'NET_BANKING' && <AccountBalanceIcon color={isSelected ? 'primary' : 'action'} />}
                        {pm.method === 'CASH_ON_DELIVERY' && <LocalShippingIcon color={isSelected ? 'primary' : 'action'} />}
                        {pm.method === 'WALLET' && <AccountBalanceWalletIcon color={isSelected ? 'primary' : 'action'} />}
                      </Box>
                      <Typography variant="body2" fontWeight={700} sx={{ color: isSelected ? '#1d4ed8' : '#334155', fontSize: '0.8rem' }}>
                        {pm.name}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              {/* Dynamic Payment Details Inputs */}
              {selectedMethod === 'UPI' && (
                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', mb: 2 }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: '#475569', display: 'block', mb: 1 }}>
                    Enter Virtual Payment Address (VPA) / UPI ID:
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. rahul@okhdfcbank or 9876543210@paytm"
                    value={paymentDetails}
                    onChange={(e) => setPaymentDetails(e.target.value)}
                    helperText="Simulated NPCI 12-digit UTR reference will be generated on confirmation."
                  />
                </Box>
              )}

              {(selectedMethod === 'CREDIT_CARD' || selectedMethod === 'DEBIT_CARD') && (
                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', mb: 2 }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: '#475569', display: 'block', mb: 1 }}>
                    Card Details (Simulated 3DS 2.0 Auth):
                  </Typography>
                  <Stack spacing={1.5}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Card Number: 4532 8901 2345 6789"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                    />
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                      <TextField
                        size="small"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                      />
                      <TextField
                        size="small"
                        type="password"
                        placeholder="CVV"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                      />
                    </Box>
                  </Stack>
                </Box>
              )}

              {selectedMethod === 'NET_BANKING' && (
                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', mb: 2 }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: '#475569', display: 'block', mb: 1 }}>
                    Select Your Bank:
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)}>
                      <MenuItem value="HDFC Bank">HDFC Bank</MenuItem>
                      <MenuItem value="State Bank of India">State Bank of India (SBI)</MenuItem>
                      <MenuItem value="ICICI Bank">ICICI Bank</MenuItem>
                      <MenuItem value="Axis Bank">Axis Bank</MenuItem>
                      <MenuItem value="Kotak Mahindra Bank">Kotak Mahindra Bank</MenuItem>
                      <MenuItem value="Punjab National Bank">Punjab National Bank</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}

              {selectedMethod === 'WALLET' && (
                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', mb: 2 }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: '#475569', display: 'block', mb: 1 }}>
                    Select Digital Wallet:
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select value={selectedWallet} onChange={(e) => setSelectedWallet(e.target.value)}>
                      <MenuItem value="Paytm Wallet">Paytm Wallet</MenuItem>
                      <MenuItem value="Amazon Pay Balance">Amazon Pay</MenuItem>
                      <MenuItem value="PhonePe Wallet">PhonePe Wallet</MenuItem>
                      <MenuItem value="MobiKwik">MobiKwik</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}

              {selectedMethod === 'CASH_ON_DELIVERY' && (
                <Box sx={{ p: 2, bgcolor: '#ecfdf5', borderRadius: 2, border: '1px solid #a7f3d0', mb: 2 }}>
                  <Typography variant="body2" sx={{ color: '#065f46', fontWeight: 600 }}>
                    💵 Pay exact cash of {formatINR(finalTotal)} to the delivery agent upon parcel handover. A Delhivery courier tracking code will be generated.
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Error Simulation Diagnostics Box */}
            <Box sx={{ mb: 3, p: 2, bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <BugReportIcon sx={{ color: '#dc2626', fontSize: 20 }} />
                <Typography variant="subtitle2" fontWeight={800} sx={{ color: '#991b1b' }}>
                  Simulate Error in Flow (Test Logback & Failure Abort)
                </Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#7f1d1d', display: 'block', mb: 1.5 }}>
                When an error is simulated, the flow STOPS immediately: no order is created in MySQL, the cart is preserved, and structured error logs are output to <code>order-service-json.log</code>.
              </Typography>
              <FormControl size="small" fullWidth sx={{ bgcolor: '#ffffff' }}>
                <Select
                  value={simulateError}
                  onChange={(e) => setSimulateError(e.target.value)}
                  sx={{ borderRadius: 1.5 }}
                >
                  <MenuItem value="none">
                    <strong>✅ Normal Checkout (Flow succeeds, order is created)</strong>
                  </MenuItem>
                  <MenuItem value="payment_timeout">
                    🔴 Simulate Payment Gateway 504 Timeout (Flow aborts)
                  </MenuItem>
                  <MenuItem value="insufficient_stock">
                    🔴 Simulate Insufficient Stock 400 Error (Flow aborts)
                  </MenuItem>
                  <MenuItem value="downstream_failure">
                    🔴 Simulate Downstream Product-Service 503 Outage (Flow aborts)
                  </MenuItem>
                  <MenuItem value="null_pointer">
                    🔴 Simulate Internal Server NullPointerException 500 (Flow aborts)
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>

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

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultTab={authTab}
      />
    </Dialog>
  );
}
