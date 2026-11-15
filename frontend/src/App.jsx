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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Navbar from './components/Navbar';
import ProductCard from './components/ProductCard';
import ProductDialog from './components/ProductDialog';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import OrderHistory from './components/OrderHistory';
import AdminCatalog from './components/AdminCatalog';
import SystemHealth from './components/SystemHealth';
import { CartProvider } from './context/CartContext';
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
      secondary: '#475569',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
});

export default function App() {
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
      setCategories(['All', 'Electronics', 'Computers', 'Accessories', 'Audio', 'Wearables']);
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
    fetchProducts(); // Refresh stock counts in real time!
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <CartProvider>
        <Box sx={{ minHeight: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc', m: 0, p: 0 }}>
          {/* Top Navbar - 100% Full Width */}
          <Navbar activeTab={activeTab} onTabChange={setActiveTab} />

          {/* Main Content Area - Full Screen Width */}
          <Container maxWidth={false} sx={{ flexGrow: 1, py: 3, px: { xs: 2, sm: 3, md: 4, lg: 5 } }}>
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
                    ShopWave Storefront (INR ₹)
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#cbd5e1', maxWidth: 700, mb: 3 }}>
                    Explore top-tier consumer tech with real-time stock sync across Spring Boot 3 Microservices and MySQL.
                  </Typography>

                  {/* Search Bar */}
                  <Box sx={{ maxWidth: 600, bgcolor: 'white', borderRadius: 2.5, p: 0.5, boxShadow: 2 }}>
                    <TextField
                      fullWidth
                      variant="standard"
                      placeholder="Search audio, laptops, keyboards, displays..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      InputProps={{
                        disableUnderline: true,
                        startAdornment: (
                          <InputAdornment position="start" sx={{ pl: 1.5 }}>
                            <SearchIcon color="action" />
                          </InputAdornment>
                        ),
                        sx: { py: 0.8 },
                      }}
                    />
                  </Box>
                </Box>

                {/* Categories Row */}
                <Stack direction="row" spacing={1.5} sx={{ mb: 4, overflowX: 'auto', pb: 1 }}>
                  {categories.map((cat) => (
                    <Chip
                      key={cat}
                      label={cat}
                      clickable
                      color={selectedCategory === cat ? 'primary' : 'default'}
                      onClick={() => setSelectedCategory(cat)}
                      sx={{
                        fontWeight: 700,
                        px: 1.5,
                        py: 2.2,
                        borderRadius: 2.5,
                        bgcolor: selectedCategory === cat ? '#2563eb' : '#ffffff',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.9rem',
                        '&:hover': {
                          bgcolor: selectedCategory === cat ? '#1d4ed8' : '#f1f5f9',
                        },
                      }}
                    />
                  ))}
                </Stack>

                {/* Error Banner */}
                {error && (
                  <Alert severity="error" sx={{ mb: 3 }} action={
                    <Chip label="Retry" color="error" size="small" onClick={fetchProducts} clickable />
                  }>
                    {error}
                  </Alert>
                )}

                {/* Product Grid - Full Screen Responsive Layout */}
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                    <CircularProgress />
                  </Box>
                ) : products.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography variant="h6" color="text.secondary">
                      No products found matching your search.
                    </Typography>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: '100%',
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

            {/* TAB 3: ADMIN CATALOG */}
            {activeTab === 'admin' && (
              <AdminCatalog products={products} onRefresh={fetchProducts} />
            )}

            {/* TAB 4: SYSTEM HEALTH */}
            {activeTab === 'system' && <SystemHealth />}
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
      </CartProvider>
    </ThemeProvider>
  );
}
