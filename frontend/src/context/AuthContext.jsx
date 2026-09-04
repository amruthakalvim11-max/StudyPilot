import React, { createContext, useState, useEffect } from 'react';
import * as api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const res = await api.getMe();
      if (res.data.success) {
        setUser(res.data.data);
      }
    } catch (err) {
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchMe().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }

    // Global listener for 401s from interceptor
    const handleAuthExpired = () => setUser(null);
    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  const login = async (credentials) => {
    const res = await api.login(credentials);
    if (res.data.success) {
      localStorage.setItem('token', res.data.data.token);
      setUser(res.data.data.user);
    }
    return res.data;
  };

  const register = async (data) => {
    const res = await api.register(data);
    if (res.data.success) {
      localStorage.setItem('token', res.data.data.token);
      setUser(res.data.data.user);
    }
    return res.data;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
