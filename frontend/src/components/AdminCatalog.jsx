import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AdminProductModal from './AdminProductModal';
import { api } from '../services/api';
import { formatINR } from '../utils/formatCurrency';

export default function AdminCatalog({ products, onRefresh }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from MySQL database?`)) {
      try {
        await api.deleteProduct(id);
        onRefresh();
      } catch (err) {
        alert('Failed to delete product: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Product Catalog Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage inventory and pricing in MySQL (<code>ecommerce_product_db</code>)
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreate}
          sx={{ borderRadius: 2, bgcolor: '#2563eb', fontWeight: 700, textTransform: 'none' }}
        >
          Add New Product
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Price (INR)</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Stock Level</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Rating</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar variant="rounded" src={p.imageUrl} sx={{ width: 48, height: 48, bgcolor: '#f1f5f9' }} />
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700}>
                        {p.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: #{p.id}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={p.category || 'General'} size="small" variant="outlined" />
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {formatINR(p.price)}
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={`${p.stockQuantity} units`}
                    size="small"
                    color={p.stockQuantity === 0 ? 'error' : p.stockQuantity < 5 ? 'warning' : 'success'}
                    sx={{ fontWeight: 600 }}
                  />
                </TableCell>
                <TableCell align="center">
                  ⭐ {p.rating || 4.5}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit Product">
                    <IconButton size="small" color="primary" onClick={() => handleEdit(p)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Product">
                    <IconButton size="small" color="error" onClick={() => handleDelete(p.id, p.name)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <AdminProductModal
        open={modalOpen}
        product={selectedProduct}
        onClose={() => setModalOpen(false)}
        onSaved={onRefresh}
      />
    </Box>
  );
}
