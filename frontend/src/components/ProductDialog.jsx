import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Button,
  Box,
  Rating,
  Chip,
  IconButton,
  TextField,
  Stack,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/formatCurrency';

export default function ProductDialog({ open, product, onClose }) {
  const { addToCart, cartItems } = useCart();
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const cartItem = cartItems.find((item) => item.product.id === product.id);
  const currentInCart = cartItem ? cartItem.quantity : 0;
  const maxAvailable = Math.max(0, product.stockQuantity - currentInCart);

  const handleAdd = () => {
    addToCart(product, quantity);
    setQuantity(1);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight={700}>
          Product Overview
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3.5 }}>
          <Box sx={{ borderRadius: 2, overflow: 'hidden', bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center' }}>
            <img
              src={product.imageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80'}
              alt={product.name}
              style={{ width: '100%', height: 'auto', maxHeight: 350, objectFit: 'cover' }}
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
              <Chip label={product.category} color="primary" size="small" sx={{ fontWeight: 600 }} />
              <Chip
                label={product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
                color={product.stockQuantity > 0 ? 'success' : 'error'}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            </Stack>

            <Typography variant="h5" fontWeight={800} sx={{ color: '#0f172a', mb: 1.5, lineHeight: 1.3 }}>
              {product.name}
            </Typography>

            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Rating value={product.rating || 4.5} precision={0.1} readOnly size="small" />
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                ({product.rating || 4.5} rating)
              </Typography>
            </Stack>

            <Typography variant="h4" color="primary.main" fontWeight={800} sx={{ mb: 2 }}>
              {formatINR(product.price)}
            </Typography>

            <Typography variant="body1" sx={{ color: '#334155', mb: 3, lineHeight: 1.6 }}>
              {product.description}
            </Typography>

            <Divider sx={{ mb: 2 }} />

            <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 'auto' }}>
              <TextField
                type="number"
                label="Quantity"
                size="small"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(parseInt(e.target.value) || 1, maxAvailable)))}
                inputProps={{ min: 1, max: maxAvailable }}
                disabled={maxAvailable <= 0}
                sx={{ width: 100 }}
              />

              <Button
                variant="contained"
                size="large"
                fullWidth
                disabled={maxAvailable <= 0}
                startIcon={<AddShoppingCartIcon />}
                onClick={handleAdd}
                sx={{
                  borderRadius: 2,
                  py: 1.2,
                  fontWeight: 700,
                  bgcolor: '#2563eb',
                  textTransform: 'none',
                }}
              >
                {maxAvailable <= 0 ? 'Out of Stock' : `Add ${quantity} to Cart (${formatINR(product.price * quantity)})`}
              </Button>
            </Stack>
            {currentInCart > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                You already have {currentInCart} of this item in your cart.
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
