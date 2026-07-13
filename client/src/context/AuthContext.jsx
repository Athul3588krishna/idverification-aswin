/**
 * context/AuthContext.jsx
 * ---------------------------------------------------------
 * Global authentication context using React Context API.
 * Manages admin login state, JWT token persistence,
 * and provides auth helpers to all child components.
 */

import React, { createContext, useState, useEffect } from "react";

// Create the context object
export const AuthContext = createContext(null);

/**
 * AuthProvider – wraps the entire application.
 * Reads existing token from localStorage on mount.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);       // Admin user object
  const [token, setToken] = useState(null);     // JWT token string
  const [loading, setLoading] = useState(true); // Initial auth check in progress

  // On mount: restore session from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("examshield_token");
    const storedUser = localStorage.getItem("examshield_user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setLoading(false); // Auth check complete
  }, []);

  /**
   * login – called after successful API authentication.
   * Persists token and user to localStorage.
   */
  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem("examshield_token", jwtToken);
    localStorage.setItem("examshield_user", JSON.stringify(userData));
  };

  /**
   * logout – clears all auth state and storage.
   */
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("examshield_token");
    localStorage.removeItem("examshield_user");
  };

  // Expose auth state and actions to all consumers
  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
