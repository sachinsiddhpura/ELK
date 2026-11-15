import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Box,
  Container,
  Chip,
} from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import DnsIcon from '@mui/icons-material/Dns';
import { useCart } from '../context/CartContext';

export default function Navbar({ activeTab, onTabChange }) {
  const { cartCount, setIsCartOpen } = useCart();

  return (
    <AppBar position="sticky" elevation={2} sx={{ width: '100%', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' }}>
      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Toolbar disableGutters sx={{ py: 1 }}>
          {/* Logo & Brand */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              mr: 4,
            }}
            onClick={() => onTabChange('storefront')}
          >
            <Box
              sx={{
                bgcolor: 'primary.main',
                p: 1,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37,99,235,0.4)',
              }}
            >
              <ShoppingBagIcon sx={{ color: 'white', fontSize: 26 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: '-0.5px', color: 'white' }}>
                ShopWave
              </Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: -0.5 }}>
                Spring Boot Microservices
              </Typography>
            </Box>
          </Box>

          {/* Navigation Items */}
          <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
            <Button
              color="inherit"
              startIcon={<ShoppingBagIcon />}
              onClick={() => onTabChange('storefront')}
              sx={{
                borderRadius: 2,
                px: 2,
                bgcolor: activeTab === 'storefront' ? 'rgba(255,255,255,0.12)' : 'transparent',
                fontWeight: activeTab === 'storefront' ? 700 : 500,
                color: activeTab === 'storefront' ? '#60a5fa' : '#cbd5e1',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
              }}
            >
              Storefront
            </Button>

            <Button
              color="inherit"
              startIcon={<ReceiptLongIcon />}
              onClick={() => onTabChange('orders')}
              sx={{
                borderRadius: 2,
                px: 2,
                bgcolor: activeTab === 'orders' ? 'rgba(255,255,255,0.12)' : 'transparent',
                fontWeight: activeTab === 'orders' ? 700 : 500,
                color: activeTab === 'orders' ? '#60a5fa' : '#cbd5e1',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
              }}
            >
              Orders
            </Button>

            <Button
              color="inherit"
              startIcon={<Inventory2Icon />}
              onClick={() => onTabChange('admin')}
              sx={{
                borderRadius: 2,
                px: 2,
                bgcolor: activeTab === 'admin' ? 'rgba(255,255,255,0.12)' : 'transparent',
                fontWeight: activeTab === 'admin' ? 700 : 500,
                color: activeTab === 'admin' ? '#60a5fa' : '#cbd5e1',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
              }}
            >
              Manage Catalog
            </Button>

            <Button
              color="inherit"
              startIcon={<DnsIcon />}
              onClick={() => onTabChange('system')}
              sx={{
                borderRadius: 2,
                px: 2,
                bgcolor: activeTab === 'system' ? 'rgba(255,255,255,0.12)' : 'transparent',
                fontWeight: activeTab === 'system' ? 700 : 500,
                color: activeTab === 'system' ? '#60a5fa' : '#cbd5e1',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
              }}
            >
              System Status
            </Button>
          </Box>

          {/* Right Action: Cart Drawer Trigger */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label="Gateway: 8080"
              size="small"
              sx={{
                bgcolor: 'rgba(34, 197, 94, 0.15)',
                color: '#4ade80',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                fontWeight: 600,
                display: { xs: 'none', md: 'inline-flex' },
              }}
            />

            <IconButton
              color="inherit"
              onClick={() => setIsCartOpen(true)}
              sx={{
                bgcolor: 'rgba(255,255,255,0.08)',
                p: 1.2,
                borderRadius: 2,
                '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' },
              }}
            >
              <Badge badgeContent={cartCount} color="error" max={99}>
                <ShoppingCartIcon sx={{ color: 'white' }} />
              </Badge>
            </IconButton>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

