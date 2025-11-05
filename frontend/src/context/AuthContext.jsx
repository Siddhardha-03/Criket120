import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const STORAGE_TOKEN_KEY = 'authToken';
const STORAGE_USER_KEY = 'authUser';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem(STORAGE_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials);
    localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    return data;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_USER_KEY);
    setToken(null);
    setUser(null);
  };

  const forgotPassword = async (payload) => {
    const { data } = await api.post('/auth/forgot-password', payload);
    return data;
  };

  const resetPassword = async (tokenParam, payload) => {
    const { data } = await api.post(`/auth/reset-password?token=${tokenParam}`, payload);
    return data;
  };

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      register,
      logout,
      forgotPassword,
      resetPassword,
      setUser: (updatedUser) => {
        setUser(updatedUser);
        if (updatedUser) {
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updatedUser));
        } else {
          localStorage.removeItem(STORAGE_USER_KEY);
        }
      },
    }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
