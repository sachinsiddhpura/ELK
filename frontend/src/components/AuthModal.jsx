import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Stack,
  Divider,
  Card,
  CardActionArea,
  Chip,
  CircularProgress,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import SecurityIcon from '@mui/icons-material/Security';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function AuthModal({ open, onClose, defaultTab = 0 }) {
  const { login, register, loading } = useAuth();

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Dynamic credentials loaded directly from MySQL database
  const [demoUsers, setDemoUsers] = useState([]);
  const [fetchingDemo, setFetchingDemo] = useState(false);

  React.useEffect(() => {
    if (open) {
      setFetchingDemo(true);
      api.getDemoCredentials()
        .then((data) => {
          if (Array.isArray(data)) {
            setDemoUsers(data);
          }
        })
        .catch((err) => console.error('Failed to load credentials from MySQL database:', err))
        .finally(() => setFetchingDemo(false));
    }
  }, [open]);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  });

  // Registration form state (Customer Only)
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setError(null);
    setSuccessMsg(null);
  };

  // Quick-fill credentials on click
  const fillCredentials = (email, password) => {
    setLoginForm({ email, password });
    setError(null);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await login(loginForm);
      onClose();
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Invalid credentials or authentication server unavailable');
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await register(regForm);
      setSuccessMsg('Customer account created successfully with JWT token!');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.error || 'Registration failed. Email may already be in use.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <SecurityIcon sx={{ color: '#2563eb' }} />
          <Typography variant="h6" fontWeight={800}>
            ShopWave Authentication (JWT)
          </Typography>
        </Box>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ minHeight: 44 }}>
          <Tab
            icon={<LockOpenIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Sign In"
            sx={{ fontWeight: 700, textTransform: 'none' }}
          />
          <Tab
            icon={<HowToRegIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label="Register (Customer Only)"
            sx={{ fontWeight: 700, textTransform: 'none' }}
          />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {successMsg && (
          <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
            {successMsg}
          </Alert>
        )}

        {/* TAB 0: LOGIN */}
        {activeTab === 0 && (
          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: '#475569' }}>
              💡 Database Credentials (Loaded dynamically from MySQL <code>ecommerce_user_db</code>):
            </Typography>

            {fetchingDemo ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.secondary">
                  Loading users from database...
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 3 }}>
                {demoUsers.map((item) => {
                  const isRoleAdmin = item.role === 'ROLE_ADMIN';
                  const isSelected = loginForm.email === item.email;
                  return (
                    <Card
                      key={item.email}
                      variant="outlined"
                      sx={{
                        borderRadius: 2,
                        bgcolor: isSelected
                          ? isRoleAdmin
                            ? '#ede9fe'
                            : '#e0f2fe'
                          : isRoleAdmin
                          ? '#faf5ff'
                          : '#f0f9ff',
                        borderColor: isSelected
                          ? isRoleAdmin
                            ? '#7c3aed'
                            : '#0284c7'
                          : isRoleAdmin
                          ? '#d8b4fe'
                          : '#bae6fd',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          borderColor: isRoleAdmin ? '#7c3aed' : '#0284c7',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <CardActionArea
                        onClick={() => fillCredentials(item.email, item.password)}
                        sx={{ p: 1.5, textAlign: 'left' }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            {isRoleAdmin ? (
                              <AdminPanelSettingsIcon sx={{ color: '#7c3aed', fontSize: 20 }} />
                            ) : (
                              <PersonIcon sx={{ color: '#0284c7', fontSize: 20 }} />
                            )}
                            <Typography
                              variant="subtitle2"
                              fontWeight={800}
                              color={isRoleAdmin ? '#5b21b6' : '#0369a1'}
                            >
                              {item.label || (isRoleAdmin ? 'Administrator' : 'Customer')}
                            </Typography>
                          </Box>
                          <Chip
                            label={isRoleAdmin ? 'All Access' : 'Shopper'}
                            size="small"
                            color={isRoleAdmin ? 'secondary' : 'info'}
                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                          />
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            color: isRoleAdmin ? '#6b21a8' : '#0369a1',
                            fontWeight: 600,
                          }}
                        >
                          {item.email}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: isRoleAdmin ? '#9333ea' : '#0284c7', display: 'block' }}
                        >
                          Pass: <code>{item.password}</code>
                        </Typography>
                      </CardActionArea>
                    </Card>
                  );
                })}
              </Box>
            )}

            <Divider sx={{ mb: 2.5 }} />

            <form onSubmit={handleLoginSubmit}>
              <Stack spacing={2} sx={{ mb: 3 }}>
                <TextField
                  required
                  fullWidth
                  type="email"
                  size="small"
                  label="Email Address"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder="Enter email or click demo card above"
                />
                <TextField
                  required
                  fullWidth
                  type="password"
                  size="small"
                  label="Password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="Enter password"
                />
              </Stack>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <LockOpenIcon />}
                sx={{
                  py: 1.2,
                  borderRadius: 2,
                  fontWeight: 800,
                  textTransform: 'none',
                  bgcolor: '#2563eb',
                }}
              >
                {loading ? 'Authenticating with JWT...' : 'Sign In with JWT'}
              </Button>
            </form>
          </Box>
        )}

        {/* TAB 1: REGISTER CUSTOMER ONLY */}
        {activeTab === 1 && (
          <Box>
            <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
              <Typography variant="caption" fontWeight={700}>
                Security Policy: All registrations automatically assign the <strong>Customer</strong> role. Only pre-configured administrators have full system and catalog control.
              </Typography>
            </Alert>

            <form onSubmit={handleRegisterSubmit}>
              <Stack spacing={2} sx={{ mb: 3 }}>
                <TextField
                  required
                  fullWidth
                  size="small"
                  label="Full Name"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                />
                <TextField
                  required
                  fullWidth
                  type="email"
                  size="small"
                  label="Email Address"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  placeholder="name@example.com"
                />
                <TextField
                  required
                  fullWidth
                  type="password"
                  size="small"
                  label="Password (min 6 chars)"
                  value={regForm.password}
                  onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Phone / Mobile"
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="City / State"
                    value={regForm.address}
                    onChange={(e) => setRegForm({ ...regForm, address: e.target.value })}
                    placeholder="e.g. Bengaluru, Karnataka"
                  />
                </Box>
              </Stack>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <HowToRegIcon />}
                sx={{
                  py: 1.2,
                  borderRadius: 2,
                  fontWeight: 800,
                  textTransform: 'none',
                  bgcolor: '#059669',
                  '&:hover': { bgcolor: '#047857' },
                }}
              >
                {loading ? 'Creating Customer Account...' : 'Register as Customer (JWT)'}
              </Button>
            </form>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
