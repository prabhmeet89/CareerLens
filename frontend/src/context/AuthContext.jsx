import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axiosClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Clear any existing auth error
  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  // Fetch candidate profile for the authenticated user
  const fetchProfileData = useCallback(async () => {
    try {
      setProfileLoading(true);
      const res = await api.get('/profile/me');
      if (res.data?.success && res.data?.data) {
        setProfile(res.data.data);
        return res.data.data;
      } else {
        setProfile(null);
        return null;
      }
    } catch {
      setProfile(null);
      return null;
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Public method to refresh profile (e.g. after upload/analyze)
  const refreshProfile = useCallback(async () => {
    const p = await fetchProfileData();
    // Also refresh user data in case tagline changed
    try {
      const userRes = await api.get('/auth/me');
      if (userRes.data?.success && userRes.data?.user) {
        setUser(userRes.data.user);
      }
    } catch {
      // ignore
    }
    return p;
  }, [fetchProfileData]);

  // Fetch current authenticated user and profile on initial app load / refresh
  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/me');
      if (response.data?.success && response.data?.user) {
        setUser(response.data.user);
        // Fetch candidate profile in parallel / immediately
        try {
          const profRes = await api.get('/profile/me');
          if (profRes.data?.success && profRes.data?.data) {
            setProfile(profRes.data.data);
          } else {
            setProfile(null);
          }
        } catch {
          setProfile(null);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch {
      // 401 Unauthorized is expected when user is not logged in
      setUser(null);
      setProfile(null);
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
        // Fetch profile
        await fetchProfileData();
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
        setProfile(null);
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
      setProfile(null);
      setAuthError(null);
    }
  };

  const value = {
    user,
    profile,
    hasProfile: !!profile,
    profileLoading,
    loading,
    authError,
    clearError,
    login,
    register,
    logout,
    checkAuth,
    refreshProfile,
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
