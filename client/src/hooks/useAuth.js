/**
 * hooks/useAuth.js
 * ---------------------------------------------------------
 * Custom hook to consume the AuthContext.
 * Provides a clean API for all components that need auth state.
 */

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

/**
 * useAuth
 * @returns {{ user, token, loading, isAuthenticated, login, logout }}
 */
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default useAuth;
