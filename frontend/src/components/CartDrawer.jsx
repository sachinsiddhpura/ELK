import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Button,
  Stack,
  ButtonGroup,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/formatCurrency';

export default function CartDrawer({ onCheckout }) {
  const { isCartOpen, setIsCartOpen, cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();

  const shipping = cartTotal > 999 ? 0 : 99;
  const tax = cartTotal * 0.18; // 18% GST standard in India
  const finalTotal = cartTotal + (cartTotal > 0 ? shipping + tax : 0);

  return (
    <Drawer
      anchor="right"
      open={isCartOpen}
      onClose={() => setIsCartOpen(false)}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 420 }, p: 0, display: 'flex', flexDirection: 'column' },
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ShoppingBagIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            Your Cart ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})
          </Typography>
        </Box>
        <IconButton onClick={() => setIsCartOpen(false)} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />

      {/* Cart Items List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        {cartItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <ShoppingBagIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
            <Typography variant="h6" fontWeight={600} color="text.secondary">
              Your cart is empty
            </Typography>
            <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
              Explore our tech catalog and add your favorite items!
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setIsCartOpen(false)}
              sx={{ borderRadius: 2, textTransform: 'none' }}
            >
              Start Shopping
            </Button>
          </Box>
        ) : (
          <List disablePadding>
            {cartItems.map(({ product, quantity }) => (
              <React.Fragment key={product.id}>
                <ListItem
                  alignItems="flex-start"
                  disableGutters
                  sx={{ py: 1.5 }}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      color="error"
                      size="small"
                      onClick={() => removeFromCart(product.id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar
                      variant="rounded"
                      src={product.imageUrl}
                      sx={{ width: 60, height: 60, mr: 1.5, bgcolor: '#f1f5f9' }}
                    />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" fontWeight={700} sx={{ pr: 3 }}>
                        {product.name}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="body2" color="primary.main" fontWeight={700} sx={{ mb: 1 }}>
                          {formatINR(product.price)} × {quantity} = {formatINR(product.price * quantity)}
                        </Typography>
                        <ButtonGroup size="small" variant="outlined" sx={{ borderRadius: 1 }}>
                          <Button
                            onClick={() => updateQuantity(product.id, quantity - 1)}
                            sx={{ minWidth: 28, p: 0.5 }}
                          >
                            <RemoveIcon fontSize="small" />
                          </Button>
                          <Button disabled sx={{ color: 'text.primary !important', fontWeight: 700, minWidth: 36 }}>
                            {quantity}
                          </Button>
                          <Button
                            onClick={() => updateQuantity(product.id, quantity + 1)}
                            disabled={quantity >= product.stockQuantity}
                            sx={{ minWidth: 28, p: 0.5 }}
                          >
                            <AddIcon fontSize="small" />
                          </Button>
                        </ButtonGroup>
                      </Box>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>

      {/* Footer / Summary */}
      {cartItems.length > 0 && (
        <Box sx={{ p: 2.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Stack spacing={1} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Subtotal</Typography>
              <Typography variant="body2" fontWeight={600}>{formatINR(cartTotal)}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">Shipping</Typography>
              <Typography variant="body2" fontWeight={600} color={shipping === 0 ? 'success.main' : 'text.primary'}>
                {shipping === 0 ? 'FREE (Over ₹999)' : formatINR(shipping)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">GST (18%)</Typography>
              <Typography variant="body2" fontWeight={600}>{formatINR(tax)}</Typography>
            </Box>
            <Divider sx={{ my: 0.5 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle1" fontWeight={700}>Total</Typography>
              <Typography variant="subtitle1" fontWeight={800} color="primary.main">
                {formatINR(finalTotal)}
              </Typography>
            </Box>
          </Stack>

          <Button
            variant="contained"
            fullWidth
            size="large"
            endIcon={<ArrowForwardIcon />}
            onClick={() => {
              setIsCartOpen(false);
              onCheckout();
            }}
            sx={{
              borderRadius: 2,
              py: 1.4,
              fontWeight: 700,
              bgcolor: '#2563eb',
              textTransform: 'none',
              fontSize: '1rem',
              '&:hover': { bgcolor: '#1d4ed8' },
            }}
          >
            Checkout ({formatINR(finalTotal)})
          </Button>
        </Box>
      )}
    </Drawer>
  );
}
