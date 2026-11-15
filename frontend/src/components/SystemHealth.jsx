import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Stack,
  Divider,
  Alert,
  Paper,
  ButtonGroup,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import DnsIcon from '@mui/icons-material/Dns';
import StorageIcon from '@mui/icons-material/Storage';
import HubIcon from '@mui/icons-material/Hub';
import InsightsIcon from '@mui/icons-material/Insights';
import BugReportIcon from '@mui/icons-material/BugReport';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { api } from '../services/api';

export default function SystemHealth() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bugOutput, setBugOutput] = useState(null);
  const [bugLoading, setBugLoading] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getSystemHealth();
      setHealthData(data);
    } catch (err) {
      console.error('Failed to get health status', err);
      setError('Unable to reach API Gateway on port 8080. Please ensure the microservices are running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleTriggerBug = async (service, type) => {
    setBugLoading(true);
    setBugOutput(null);
    try {
      if (service === 'product') {
        await api.simulateProductBug(type);
      } else {
        await api.simulateOrderBug(type);
      }
      setBugOutput({
        type: 'info',
        service,
        msg: `Triggered ${type} on ${service}-service.`,
      });
    } catch (err) {
      const logFile = service === 'product' ? 'product-service/logs/product-service-error.log' : 'order-service/logs/order-service-error.log';
      setBugOutput({
        type: 'error',
        service,
        errorType: type,
        status: err.response?.status || 500,
        message: err.response?.data?.message || err.response?.data?.error || err.message,
        logTarget: logFile,
        timestamp: new Date().toLocaleTimeString(),
      });
    } finally {
      setBugLoading(false);
    }
  };

  const services = [
    {
      name: 'API Gateway',
      port: 8080,
      description: 'Reverse proxy, routing, unified CORS, request aggregation & logging.',
      status: healthData?.gateway?.status || (error ? 'DOWN' : 'UNKNOWN'),
      icon: <HubIcon sx={{ fontSize: 36, color: '#2563eb' }} />,
      routes: ['/api/products/** -> 8081', '/api/orders/** -> 8082', '/api/system/health'],
    },
    {
      name: 'Product Service',
      port: 8081,
      description: 'MySQL: ecommerce_product_db. Manages catalog, INR pricing & stock deduction.',
      status: healthData?.services?.['product-service']?.status || (error ? 'DOWN' : 'UNKNOWN'),
      icon: <StorageIcon sx={{ fontSize: 36, color: '#059669' }} />,
      routes: ['GET /api/products', 'GET /api/products/simulate-bug', 'PUT /api/products/{id}/deduct-stock'],
    },
    {
      name: 'Order Service',
      port: 8082,
      description: 'MySQL: ecommerce_order_db. Handles orders, stock deductions & payment flows.',
      status: healthData?.services?.['order-service']?.status || (error ? 'DOWN' : 'UNKNOWN'),
      icon: <DnsIcon sx={{ fontSize: 36, color: '#7c3aed' }} />,
      routes: ['GET /api/orders', 'POST /api/orders', 'GET /api/orders/simulate-bug'],
    },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Microservices Cluster & MySQL Telemetry
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Live telemetry, logback integration, and inter-service error diagnostics
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchHealth}
          disabled={loading}
          sx={{ borderRadius: 2, textTransform: 'none' }}
        >
          Check Now
        </Button>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Services Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
        {services.map((svc) => {
          const isUp = svc.status === 'UP';
          return (
            <Card
              key={svc.name}
              elevation={0}
              sx={{
                borderRadius: 3,
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease',
                '&:hover': { transform: 'translateY(-3px)' },
              }}
            >
              <CardContent sx={{ p: 3, flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ p: 1.2, bgcolor: '#f1f5f9', borderRadius: 2 }}>{svc.icon}</Box>
                  <Chip
                    icon={isUp ? <CheckCircleIcon /> : <ErrorOutlinedIcon />}
                    label={svc.status}
                    color={isUp ? 'success' : 'error'}
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                </Box>

                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {svc.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 700, display: 'block', mb: 1 }}>
                  PORT: {svc.port}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {svc.description}
                </Typography>

                <Divider sx={{ my: 1.5 }} />

                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase' }}>
                  Key Endpoints:
                </Typography>
                <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                  {svc.routes.map((r, i) => (
                    <Typography key={i} variant="caption" sx={{ fontFamily: 'monospace', color: '#475569' }}>
                      • {r}
                    </Typography>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Interactive Bug Simulation & Log Inspection Console */}
      <Card elevation={0} sx={{ border: '2px dashed #f59e0b', borderRadius: 3, p: 3, mb: 4, bgcolor: '#fffbeb' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <BugReportIcon sx={{ color: '#d97706', fontSize: 28 }} />
          <Typography variant="h6" fontWeight={800} sx={{ color: '#92400e' }}>
            Bug Simulation & Logback Diagnostics Console
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#78350f', mb: 2.5 }}>
          Click the buttons below to intentionally trigger real exceptions and errors in the microservices to inspect how they appear in <code>logback-spring.xml</code>, the console, and log files.
        </Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          {/* Product Service Bugs */}
          <Box sx={{ bgcolor: 'white', p: 2.5, borderRadius: 2, border: '1px solid #fed7aa' }}>
            <Typography variant="subtitle2" fontWeight={800} color="error" gutterBottom>
              Product Service Errors (Port 8081)
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
              <Button
                variant="outlined"
                color="error"
                size="small"
                disabled={bugLoading}
                onClick={() => handleTriggerBug('product', 'npe')}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Trigger NPE
              </Button>
              <Button
                variant="outlined"
                color="warning"
                size="small"
                disabled={bugLoading}
                onClick={() => handleTriggerBug('product', 'deadlock')}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Trigger MySQL Deadlock
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                disabled={bugLoading}
                onClick={() => handleTriggerBug('product', 'arithmetic')}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Division by Zero
              </Button>
            </Stack>
          </Box>

          {/* Order Service Bugs */}
          <Box sx={{ bgcolor: 'white', p: 2.5, borderRadius: 2, border: '1px solid #fed7aa' }}>
            <Typography variant="subtitle2" fontWeight={800} color="error" gutterBottom>
              Order Service Errors (Port 8082)
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
              <Button
                variant="outlined"
                color="error"
                size="small"
                disabled={bugLoading}
                onClick={() => handleTriggerBug('order', 'payment')}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Payment Gateway 504
              </Button>
              <Button
                variant="outlined"
                color="warning"
                size="small"
                disabled={bugLoading}
                onClick={() => handleTriggerBug('order', 'inter-service')}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Inter-Service Circuit Failure
              </Button>
              <Button
                variant="outlined"
                color="error"
                size="small"
                disabled={bugLoading}
                onClick={() => handleTriggerBug('order', 'inventory-leak')}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
              >
                Inventory State Desync
              </Button>
            </Stack>
          </Box>
        </Box>

        {/* Live Bug Simulation Result Banner */}
        {bugOutput && (
          <Box sx={{ mt: 2.5, p: 2, bgcolor: '#0f172a', color: '#f8fafc', borderRadius: 2, fontFamily: 'monospace' }}>
            <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 700, display: 'block' }}>
              [{bugOutput.timestamp}] INJECTED BUG: {bugOutput.errorType?.toUpperCase()} ON {bugOutput.service?.toUpperCase()}-SERVICE (HTTP {bugOutput.status})
            </Typography>
            <Typography variant="body2" sx={{ color: '#fca5a5', my: 0.5 }}>
              Message: {bugOutput.message}
            </Typography>
            <Typography variant="caption" sx={{ color: '#4ade80', display: 'block' }}>
              ✓ Log Written to: {bugOutput.logTarget}
            </Typography>
          </Box>
        )}
      </Card>

      {/* Database & Architecture Card */}
      <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <InsightsIcon color="primary" />
          <Typography variant="h6" fontWeight={700}>
            MySQL Database & Microservices Configuration
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
          1. <strong>Database Engine:</strong> MySQL Server (<code>localhost:3306</code>) with user <code>root</code>.<br />
          2. <strong>Product Database:</strong> <code>ecommerce_product_db</code> stores products in INR (₹) currency with automatic schema migration (Hibernate <code>ddl-auto=update</code>).<br />
          3. <strong>Order Database:</strong> <code>ecommerce_order_db</code> stores orders and line items with relational integrity.<br />
          4. <strong>Atomic Stock Transactions:</strong> Order placement synchronizes stock deduction in MySQL across both services via API Gateway.
        </Typography>
      </Paper>
    </Box>
  );
}
