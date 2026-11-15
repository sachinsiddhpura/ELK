import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Divider,
  Alert,
  CircularProgress,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { api } from '../services/api';

export default function AdminProductModal({ open, product, onClose, onSaved }) {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stockQuantity: '',
    category: '',
    imageUrl: '',
    rating: 4.5,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load categories dynamically from database
  useEffect(() => {
    if (open) {
      api.getProductCategories()
        .then((cats) => {
          if (Array.isArray(cats)) {
            setCategories(cats);
          }
        })
        .catch((err) => console.error('Failed to load categories from database:', err));
    }
  }, [open]);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price || '',
        stockQuantity: product.stockQuantity || '',
        category: product.category || '',
        imageUrl: product.imageUrl || '',
        rating: product.rating || 4.5,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        stockQuantity: '',
        category: '',
        imageUrl: '',
        rating: 4.5,
      });
    }
    setError(null);
  }, [product, open]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.stockQuantity) {
      setError('Please fill in product name, price, and stock quantity.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      ...formData,
      price: parseFloat(formData.price),
      stockQuantity: parseInt(formData.stockQuantity),
      rating: parseFloat(formData.rating) || 4.5,
    };

    try {
      if (product?.id) {
        await api.updateProduct(product.id, payload);
      } else {
        await api.createProduct(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error('Error saving product', err);
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to save product in MySQL');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {product ? 'Edit Product in MySQL' : 'Add New Product to MySQL Catalog'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              required
              fullWidth
              size="small"
              label="Product Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                label="Category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="e.g. Electronics, Audio, Wearables"
                helperText="Enter or select category (saved to MySQL)"
              />

              <TextField
                required
                fullWidth
                size="small"
                type="number"
                label="Price (INR)"
                name="price"
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                }}
                value={formData.price}
                onChange={handleChange}
              />
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField
                required
                fullWidth
                size="small"
                type="number"
                label="Stock Quantity"
                name="stockQuantity"
                value={formData.stockQuantity}
                onChange={handleChange}
              />

              <TextField
                fullWidth
                size="small"
                type="number"
                label="Rating (1.0 - 5.0)"
                name="rating"
                inputProps={{ step: 0.1, min: 1, max: 5 }}
                value={formData.rating}
                onChange={handleChange}
              />
            </Box>

            <TextField
              fullWidth
              size="small"
              label="Image URL"
              name="imageUrl"
              placeholder="https://images.unsplash.com/..."
              value={formData.imageUrl}
              onChange={handleChange}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              size="small"
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
            />
          </Box>
        </DialogContent>
        <Divider />
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} disabled={loading} sx={{ textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
            sx={{ borderRadius: 2, px: 3, fontWeight: 700, textTransform: 'none', bgcolor: '#2563eb' }}
          >
            {loading ? 'Saving to MySQL...' : 'Save Product'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
