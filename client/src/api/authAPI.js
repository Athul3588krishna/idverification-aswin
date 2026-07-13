/**
 * api/authAPI.js
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   Centralizes all auth-related API call functions.
 *   Each function maps to one backend route and returns
 *   the Axios response data.
 *
 * WHY A SEPARATE API MODULE?
 *   • Components stay clean — no raw axios calls inside JSX
 *   • If the API URL changes, update it in ONE place
 *   • Easy to mock in tests
 *   • Consistent error surface — Axios throws on non-2xx,
 *     which React components catch in try/catch blocks
 *
 * USAGE IN A COMPONENT:
 *   import { loginAPI, registerUserAPI } from '../api/authAPI';
 *   const { token, user } = await loginAPI({ email, password });
 * ═══════════════════════════════════════════════════════════════
 */

import axiosInstance from "./axiosInstance";

/**
 * loginAPI
 * POST /api/auth/login
 * @param {{ email: string, password: string }} credentials
 * @returns {{ success, token, user, message }}
 */
export const loginAPI = async (credentials) => {
  const { data } = await axiosInstance.post("/auth/login", credentials);
  return data;
};

/**
 * registerUserAPI
 * POST /api/auth/register  (Admin only)
 * @param {Object} userData - { name, email, password, role, phone, ...studentFields }
 * @returns {{ success, user, message }}
 */
export const registerUserAPI = async (userData) => {
  const { data } = await axiosInstance.post("/auth/register", userData);
  return data;
};

/**
 * getMeAPI
 * GET /api/auth/me
 * @returns {{ success, user }}
 */
export const getMeAPI = async () => {
  const { data } = await axiosInstance.get("/auth/me");
  return data;
};

/**
 * updateProfileAPI
 * PUT /api/auth/me
 * @param {{ name?: string, phone?: string }} profileData
 * @returns {{ success, user, message }}
 */
export const updateProfileAPI = async (profileData) => {
  const { data } = await axiosInstance.put("/auth/me", profileData);
  return data;
};

/**
 * changePasswordAPI
 * PUT /api/auth/password
 * @param {{ currentPassword: string, newPassword: string }} passwordData
 * @returns {{ success, token, message }}
 */
export const changePasswordAPI = async (passwordData) => {
  const { data } = await axiosInstance.put("/auth/password", passwordData);
  return data;
};

/**
 * getAllUsersAPI
 * GET /api/auth/users  (Admin only)
 * @param {{ role?, search?, page?, limit?, isActive? }} params
 * @returns {{ success, users, total, page, pages }}
 */
export const getAllUsersAPI = async (params = {}) => {
  const { data } = await axiosInstance.get("/auth/users", { params });
  return data;
};

/**
 * getUserByIdAPI
 * GET /api/auth/users/:id  (Admin only)
 * @param {string} id
 * @returns {{ success, user }}
 */
export const getUserByIdAPI = async (id) => {
  const { data } = await axiosInstance.get(`/auth/users/${id}`);
  return data;
};

/**
 * updateUserStatusAPI
 * PUT /api/auth/users/:id/status  (Admin only)
 * @param {string} id
 * @param {boolean} isActive
 * @returns {{ success, user, message }}
 */
export const updateUserStatusAPI = async (id, isActive) => {
  const { data } = await axiosInstance.put(`/auth/users/${id}/status`, { isActive });
  return data;
};

/**
 * deleteUserAPI
 * DELETE /api/auth/users/:id  (Admin only)
 * @param {string} id
 * @returns {{ success, message }}
 */
export const deleteUserAPI = async (id) => {
  const { data } = await axiosInstance.delete(`/auth/users/${id}`);
  return data;
};
