/**
 * api/axiosInstance.js
 * ---------------------------------------------------------
 * Configured Axios instance for all API calls.
 * - Sets base URL from environment variable
 * - Attaches JWT Bearer token to every request automatically
 * - Handles 401 responses globally (auto logout)
 */

import axios from "axios";

// Base URL from Vite environment variable
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout (OCR can be slow)
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request Interceptor ──────────────────────────────────────
// Attaches JWT token from localStorage to every outgoing request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("examshield_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor ─────────────────────────────────────
// Handles global errors: 401 clears storage and redirects to login
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid – force logout
      localStorage.removeItem("examshield_token");
      localStorage.removeItem("examshield_user");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
