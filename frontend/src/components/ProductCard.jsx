import React from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  Rating,
  Stack,
} from '@mui/material';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useCart } from '../context/CartContext';
import { formatINR } from '../utils/formatCurrency';

export default function ProductCard({ product, onQuickView }) {
  const { addToCart, cartItems } = useCart();

  const cartItem = cartItems.find((item) => item.product.id === product.id);
  const currentInCart = cartItem ? cartItem.quantity : 0;
  const isOutOfStock = product.stockQuantity <= 0;
  const canAddMore = product.stockQuantity > currentInCart;

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        border: '1px solid #e2e8f0',
        bgcolor: '#ffffff',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 24px -10px rgba(0,0,0,0.12)',
        },
      }}
    >
      <Box sx={{ position: 'relative', pt: '65%', overflow: 'hidden', bgcolor: '#f1f5f9' }}>
        <CardMedia
          component="img"
          image={product.imageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80'}
          alt={product.name}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease',
            '&:hover': {
              transform: 'scale(1.05)',
            },
          }}
        />
        {product.category && (
          <Chip
            label={product.category}
            size="small"
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              bgcolor: 'rgba(15, 23, 42, 0.85)',
              color: '#ffffff',
              backdropFilter: 'blur(4px)',
              fontWeight: 700,
              fontSize: '0.75rem',
            }}
          />
        )}
        <Chip
          label={isOutOfStock ? 'Out of Stock' : `${product.stockQuantity} in stock`}
          size="small"
          color={isOutOfStock ? 'error' : product.stockQuantity < 5 ? 'warning' : 'success'}
          sx={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            fontWeight: 700,
            fontSize: '0.75rem',
          }}
        />
      </Box>

      <CardContent sx={{ flexGrow: 1, p: 2.5, bgcolor: '#ffffff' }}>
        <Typography
          variant="subtitle1"
          fontWeight={800}
          sx={{
            color: '#0f172a !important',
            fontSize: '1.08rem',
            lineHeight: 1.35,
            mb: 1,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.8rem',
          }}
        >
          {product.name}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: '#475569 !important',
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.5rem',
            lineHeight: 1.5,
          }}
        >
          {product.description}
        </Typography>

        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <Rating value={product.rating || 4.5} precision={0.1} size="small" readOnly />
          <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700 }}>
            ({product.rating || 4.5})
          </Typography>
        </Stack>

        <Typography variant="h5" sx={{ color: '#2563eb', fontWeight: 800 }}>
          {formatINR(product.price)}
        </Typography>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0, gap: 1, bgcolor: '#ffffff' }}>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={<VisibilityIcon />}
          onClick={() => onQuickView(product)}
          sx={{
            borderColor: '#cbd5e1',
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 700,
            color: '#334155',
          }}
        >
          Details
        </Button>

        <Button
          fullWidth
          size="small"
          variant="contained"
          disabled={isOutOfStock || !canAddMore}
          startIcon={<AddShoppingCartIcon />}
          onClick={() => addToCart(product, 1)}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 700,
            bgcolor: '#2563eb',
            '&:hover': { bgcolor: '#1d4ed8' },
          }}
        >
          {isOutOfStock ? 'Sold Out' : currentInCart > 0 ? `Add More (${currentInCart})` : 'Add to Cart'}
        </Button>
      </CardActions>
    </Card>
  );
}
