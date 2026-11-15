import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('shopwave_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('shopwave_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If token exists, verify session with backend
    if (token && !user) {
      api.getCurrentUser()
        .then((userData) => {
          setUser(userData);
          localStorage.setItem('shopwave_user', JSON.stringify(userData));
        })
        .catch(() => {
          logout();
        });
    }
  }, [token]);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const data = await api.login(credentials);
      setToken(data.token);
      setUser(data);
      localStorage.setItem('shopwave_token', data.token);
      localStorage.setItem('shopwave_user', JSON.stringify(data));
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (customerData) => {
    setLoading(true);
    try {
      const data = await api.register(customerData);
      setToken(data.token);
      setUser(data);
      localStorage.setItem('shopwave_token', data.token);
      localStorage.setItem('shopwave_user', JSON.stringify(data));
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('shopwave_token');
    localStorage.removeItem('shopwave_user');
  };

  const isAdmin = user?.role === 'ROLE_ADMIN';
  const isCustomer = user?.role === 'ROLE_CUSTOMER';
  const isAuthenticated = Boolean(token && user);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated,
        isAdmin,
        isCustomer,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

