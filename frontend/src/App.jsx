import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  Snackbar,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import ProductDialog from './components/ProductDialog';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import OrderHistory from './components/OrderHistory';
import AdminCatalog from './components/AdminCatalog';
import SystemHealth from './components/SystemHealth';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb',
    },
    background: {
      default: '#f8fafc',
    },
    text: {
      primary: '#0f172a',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
});

function AppContent() {
  const { user, isAdmin, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('storefront');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dialogs
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Toast notifications
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Guard admin tabs: If not admin and on admin tab, switch to storefront
  useEffect(() => {
    if (!isAdmin && (activeTab === 'admin' || activeTab === 'system')) {
      setActiveTab('storefront');
    }
  }, [isAdmin, activeTab]);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProducts({
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        search: searchQuery || undefined,
      });
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products', err);
      setError('Could not connect to API Gateway on port 8080. Ensure the microservices are running.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const cats = await api.getProductCategories();
      setCategories(['All', ...cats]);
    } catch (e) {
      console.error('Failed to load categories from database:', e);
      setCategories(['All']);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      fetchProducts();
    }
  };

  const handleOrderPlaced = (order) => {
    setSnackbar({
      open: true,
      message: `Order #${order.orderNumber} successfully placed!`,
      severity: 'success',
    });
    fetchProducts();
  };

  return (
    <Box sx={{ minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc', m: 0, p: 0 }}>
      {/* Top Navbar - 100% Full Width */}
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content Area - Full Screen Width */}
      <Container maxWidth={false} sx={{ flexGrow: 1, py: 3, px: { xs: 2, sm: 3, md: 4, lg: 5 } }}>
        {/* Admin Top Notification Pill */}
        {isAdmin && (
          <Alert
            severity="info"
            icon={<AdminPanelSettingsIcon />}
            sx={{
              mb: 3,
              borderRadius: 2.5,
              bgcolor: '#faf5ff',
              border: '1px solid #d8b4fe',
              color: '#581c87',
              alignItems: 'center',
            }}
            action={
              <Button
                color="secondary"
                size="small"
                variant="contained"
                onClick={() => setActiveTab('admin')}
                sx={{ borderRadius: 2, fontWeight: 700, textTransform: 'none', bgcolor: '#7c3aed' }}
              >
                Go to Catalog Manager
              </Button>
            }
          >
            <Typography variant="subtitle2" fontWeight={800}>
              Administrator Mode Active ({user?.email})
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b21a8' }}>
              You have full privileges to edit products, update order statuses, seed inventory, and inspect cluster telemetry.
            </Typography>
          </Alert>
        )}

        {/* TAB 1: STOREFRONT */}
        {activeTab === 'storefront' && (
          <Box sx={{ width: '100%' }}>
            {/* Hero / Banner */}
            <Box
              sx={{
                width: '100%',
                p: { xs: 3, md: 4.5 },
                mb: 4,
                borderRadius: 4,
                background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
                color: 'white',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12)',
              }}
            >
              <Typography variant="overline" sx={{ letterSpacing: 2, color: '#60a5fa', fontWeight: 700 }}>
                Enterprise Microservices & MySQL
              </Typography>
              <Typography variant="h3" fontWeight={800} sx={{ mt: 0.5, mb: 1, letterSpacing: '-0.5px' }}>
                Next-Gen Tech Store
              </Typography>
              <Typography variant="body1" sx={{ color: '#94a3b8', maxWidth: 700, mb: 3 }}>
                Multi-service Spring Boot architecture with JWT authentication, MySQL transactional order processing, Logback structured JSON telemetry, and real-time inventory management.
              </Typography>

              {/* Search Bar */}
              <Box sx={{ maxWidth: 650 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search laptops, headphones, monitors (Press Enter)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#94a3b8' }} />
                      </InputAdornment>
                    ),
                    sx: {
                      bgcolor: 'white',
                      borderRadius: 3,
                      '& fieldset': { border: 'none' },
                      boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Category Filter Chips */}
            <Box sx={{ mb: 4, width: '100%' }}>
              <Stack direction="row" spacing={1.5} sx={{ overflowX: 'auto', pb: 1 }}>
                {categories.map((cat) => (
                  <Chip
                    key={cat}
                    label={cat}
                    clickable
                    color={selectedCategory === cat ? 'primary' : 'default'}
                    variant={selectedCategory === cat ? 'filled' : 'outlined'}
                    onClick={() => setSelectedCategory(cat)}
                    sx={{
                      fontWeight: 700,
                      px: 1.5,
                      py: 2.2,
                      borderRadius: 3,
                      fontSize: '0.92rem',
                      borderColor: selectedCategory === cat ? 'primary.main' : '#cbd5e1',
                    }}
                  />
                ))}
              </Stack>
            </Box>

            {/* Error Message */}
            {error && (
              <Alert severity="warning" sx={{ mb: 4, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {/* Loading Indicator */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                <CircularProgress size={50} />
              </Box>
            ) : products.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 10 }}>
                <Typography variant="h6" color="text.secondary">
                  No products found in catalog matching your filter.
                </Typography>
              </Box>
            ) : (
              /* Products Grid - Fluid Full Screen */
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: 'repeat(4, 1fr)',
                    xl: 'repeat(4, 1fr)',
                  },
                  gap: 3,
                }}
              >
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onQuickView={setQuickViewProduct}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}

        {/* TAB 2: ORDERS */}
        {activeTab === 'orders' && <OrderHistory />}

        {/* TAB 3: ADMIN CATALOG (ADMIN ONLY) */}
        {activeTab === 'admin' && isAdmin && (
          <AdminCatalog products={products} onRefresh={fetchProducts} />
        )}

        {/* TAB 4: SYSTEM HEALTH (ADMIN ONLY) */}
        {activeTab === 'system' && isAdmin && <SystemHealth />}
      </Container>

      {/* Quick View Dialog */}
      <ProductDialog
        open={Boolean(quickViewProduct)}
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />

      {/* Cart Drawer */}
      <CartDrawer onCheckout={() => setCheckoutOpen(true)} />

      {/* Checkout Modal */}
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onOrderPlaced={handleOrderPlaced}
      />

      {/* Snackbar Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
