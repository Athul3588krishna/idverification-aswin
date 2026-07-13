/**
 * context/AuthContext.jsx
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   Provides global authentication state to the entire React app
 *   using the Context API + custom hook pattern.
 *
 * STATE MANAGED HERE:
 *   • user     → Full user object { _id, name, email, role, ... }
 *   • token    → JWT string stored in localStorage
 *   • loading  → True during the initial localStorage read
 *
 * FUNCTIONS PROVIDED:
 *   • login(userData, token) → Store session
 *   • logout()               → Clear session
 *   • updateUser(data)       → Refresh user object after profile update
 *
 * WHY LOCALSTORAGE?
 *   For simplicity in this MCA project. In production, httpOnly
 *   cookies would be the more secure approach.
 *
 * USAGE:
 *   import useAuth from '../hooks/useAuth';
 *   const { user, isAuthenticated, logout } = useAuth();
 * ═══════════════════════════════════════════════════════════════
 */

import React, { createContext, useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true); // Auth check on mount

  // ── On mount: restore session from localStorage ──
  useEffect(() => {
    const storedToken = localStorage.getItem("examshield_token");
    const storedUser  = localStorage.getItem("examshield_user");

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch {
        // Corrupted storage — clear it
        localStorage.removeItem("examshield_token");
        localStorage.removeItem("examshield_user");
      }
    }

    setLoading(false);
  }, []);

  // ── login: called after successful API authentication ──
  const login = useCallback((userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem("examshield_token", jwtToken);
    localStorage.setItem("examshield_user", JSON.stringify(userData));
  }, []);

  // ── logout: clears all auth state ──
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("examshield_token");
    localStorage.removeItem("examshield_user");
  }, []);

  // ── updateUser: sync user object after profile changes ──
  const updateUser = useCallback((updatedData) => {
    const merged = { ...user, ...updatedData };
    setUser(merged);
    localStorage.setItem("examshield_user", JSON.stringify(merged));
  }, [user]);

  // ── refreshUser: re-fetch current user from API ──
  const refreshUser = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/auth/me");
      if (data.success) {
        setUser(data.user);
        localStorage.setItem("examshield_user", JSON.stringify(data.user));
      }
    } catch {
      // If refresh fails (e.g., token expired), logout
      logout();
    }
  }, [logout]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    logout,
    updateUser,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
