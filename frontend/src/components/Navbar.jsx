import React, { useState } from 'react';
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
  Avatar,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import DnsIcon from '@mui/icons-material/Dns';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

export default function Navbar({ activeTab, onTabChange }) {
  const { cartCount, setIsCartOpen } = useCart();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authDefaultTab, setAuthDefaultTab] = useState(0);

  const openSignIn = () => {
    setAuthDefaultTab(0);
    setAuthModalOpen(true);
  };

  const openRegister = () => {
    setAuthDefaultTab(1);
    setAuthModalOpen(true);
  };

  return (
    <>
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
                mr: 3,
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
                {isAdmin ? 'All Orders (Admin)' : 'My Orders'}
              </Button>

              {/* ADMIN ONLY FEATURES: Manage Catalog & System Status */}
              {isAdmin && (
                <>
                  <Button
                    color="inherit"
                    startIcon={<Inventory2Icon />}
                    onClick={() => onTabChange('admin')}
                    sx={{
                      borderRadius: 2,
                      px: 2,
                      bgcolor: activeTab === 'admin' ? 'rgba(255,255,255,0.12)' : 'transparent',
                      fontWeight: activeTab === 'admin' ? 700 : 500,
                      color: activeTab === 'admin' ? '#c084fc' : '#e9d5ff',
                      border: '1px solid rgba(192, 132, 252, 0.3)',
                      '&:hover': { bgcolor: 'rgba(192, 132, 252, 0.2)' },
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
                      color: activeTab === 'system' ? '#c084fc' : '#e9d5ff',
                      border: '1px solid rgba(192, 132, 252, 0.3)',
                      '&:hover': { bgcolor: 'rgba(192, 132, 252, 0.2)' },
                    }}
                  >
                    System Status
                  </Button>
                </>
              )}
            </Box>

            {/* Right Side: Auth State, Gateway Pill & Cart */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {/* Authenticated User Status */}
              {isAuthenticated ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      bgcolor: 'rgba(255,255,255,0.08)',
                      py: 0.6,
                      px: 1.5,
                      borderRadius: 2,
                      border: isAdmin ? '1px solid #c084fc' : '1px solid rgba(255,255,255,0.15)',
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 28,
                        height: 28,
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        bgcolor: isAdmin ? '#7c3aed' : '#0284c7',
                      }}
                    >
                      {user?.name ? user.name[0].toUpperCase() : 'U'}
                    </Avatar>

                    <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                      <Typography variant="body2" fontWeight={700} sx={{ color: 'white', lineHeight: 1.1 }}>
                        {user?.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.2 }}>
                        {isAdmin ? (
                          <Chip
                            icon={<AdminPanelSettingsIcon style={{ fontSize: 13, color: '#f3e8ff' }} />}
                            label="ADMIN"
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              bgcolor: '#9333ea',
                              color: 'white',
                            }}
                          />
                        ) : (
                          <Chip
                            icon={<PersonIcon style={{ fontSize: 13, color: '#e0f2fe' }} />}
                            label="CUSTOMER"
                            size="small"
                            sx={{
                              height: 18,
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              bgcolor: '#0284c7',
                              color: 'white',
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <Tooltip title="Sign Out">
                    <IconButton
                      onClick={logout}
                      size="small"
                      sx={{
                        color: '#f87171',
                        bgcolor: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' },
                      }}
                    >
                      <LogoutIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              ) : (
                /* Unauthenticated Controls */
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<LoginIcon />}
                    onClick={openSignIn}
                    sx={{
                      borderRadius: 2,
                      px: 2,
                      fontWeight: 700,
                      textTransform: 'none',
                      bgcolor: '#2563eb',
                      '&:hover': { bgcolor: '#1d4ed8' },
                    }}
                  >
                    Sign In
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={openRegister}
                    sx={{
                      borderRadius: 2,
                      px: 1.5,
                      fontWeight: 700,
                      textTransform: 'none',
                      color: '#93c5fd',
                      borderColor: 'rgba(147, 197, 253, 0.4)',
                      display: { xs: 'none', sm: 'inline-flex' },
                      '&:hover': { borderColor: '#93c5fd', bgcolor: 'rgba(147, 197, 253, 0.1)' },
                    }}
                  >
                    Register
                  </Button>
                </Box>
              )}

              {/* Cart Drawer Trigger */}
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

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authDefaultTab}
      />
    </>
  );
}
