import React from 'react';
import { createContext, useContext, useMemo, useState } from 'react';
import { API_BASE_URL } from '../api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({ attendee: null, token: null, role: null });

  async function login(email, password) {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Unable to sign in.');
    setAuth({ attendee: data.attendee, token: data.token, role: data.role });
    return data;
  }

  function logout() {
    setAuth({ attendee: null, token: null, role: null });
  }

  const value = useMemo(() => ({ ...auth, login, logout }), [auth]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
