import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Clear any existing auth error
  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  // Fetch current authenticated user on initial app load
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/me');
      if (response.data?.success && response.data?.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      // 401 Unauthorized is expected when user is not logged in
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login handler
  const login = async (email, password) => {
    try {
      setAuthError(null);
      const response = await api.post('/auth/login', { email, password });
      if (response.data?.success && response.data?.user) {
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
      throw new Error(response.data?.message || 'Login failed.');
    } catch (err) {
      const message = err.customMessage || err.response?.data?.message || 'Failed to sign in.';
      setAuthError(message);
      return { success: false, message };
    }
  };

  // Register handler
  const register = async (name, email, password) => {
    try {
      setAuthError(null);
      const response = await api.post('/auth/register', { name, email, password });
      if (response.data?.success && response.data?.user) {
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
      throw new Error(response.data?.message || 'Registration failed.');
    } catch (err) {
      const message = err.customMessage || err.response?.data?.message || 'Failed to create account.';
      setAuthError(message);
      return { success: false, message };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout request encountered an error, clearing client state anyway:', err);
    } finally {
      setUser(null);
      setAuthError(null);
    }
  };

  const value = {
    user,
    loading,
    authError,
    clearError,
    login,
    register,
    logout,
    checkAuth,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
