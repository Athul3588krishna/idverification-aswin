/**
 * pages/Login.jsx
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   The public login page — the first screen any user sees.
 *   Handles login for all three roles (admin, security_staff,
 *   student) from one unified form.
 *
 * FLOW:
 *   1. User enters email + password
 *   2. Submit calls loginAPI()
 *   3. On success: token + user stored via AuthContext.login()
 *   4. User redirected to /dashboard
 *   5. On error: toast notification shown
 *
 * UI FEATURES:
 *   • Animated gradient background with floating orbs
 *   • Glassmorphism login card
 *   • Password show/hide toggle
 *   • Loading spinner on submit
 *   • Role badge showing which default credentials to use
 *   • Redirects to /dashboard if already logged in
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiMail, FiLock, FiEye, FiEyeOff, FiShield } from "react-icons/fi";

import useAuth from "../hooks/useAuth";
import { loginAPI } from "../api/authAPI";

const Login = () => {
  const navigate  = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Form state
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);

  // ── Redirect if already logged in ──
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // ── Handle form field changes ──
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ── Handle form submission ──
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password.trim()) {
      toast.warn("Please enter your email and password");
      return;
    }

    setIsLoading(true);
    try {
      const data = await loginAPI({
        email:    formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      // Store token + user in context and localStorage
      login(data.user, data.token);

      toast.success(`Welcome back, ${data.user.name}! 🎉`);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message || "Login failed. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Quick-fill demo credentials ──
  const fillDemo = (email, password) => {
    setFormData({ email, password });
  };

  return (
    <div className="login-page gradient-bg">
      {/* Decorative floating orbs */}
      <div className="login-orb orb-1" />
      <div className="login-orb orb-2" />
      <div className="login-orb orb-3" />

      <div className="login-container animate-fade-in-up">
        {/* ── Brand Header ── */}
        <div className="login-brand">
          <div className="brand-icon">
            <FiShield size={36} />
          </div>
          <h1 className="brand-title">ExamShield</h1>
          <p className="brand-subtitle">
            OCR-Based Identity Verification System
          </p>
        </div>

        {/* ── Login Card ── */}
        <div className="login-card glass-card">
          <h2 className="login-heading">Welcome Back</h2>
          <p className="login-subheading">Sign in to your account</p>

          <form onSubmit={handleSubmit} noValidate>
            {/* ── Email Field ── */}
            <div className="form-group-custom">
              <label htmlFor="email" className="form-label-custom">
                Email Address
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <FiMail size={16} />
                </span>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className="form-control-custom with-icon"
                  placeholder="admin@examshield.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* ── Password Field ── */}
            <div className="form-group-custom">
              <label htmlFor="password" className="form-label-custom">
                Password
              </label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <FiLock size={16} />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="form-control-custom with-icon with-action"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="input-action-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            {/* ── Submit Button ── */}
            <button
              id="login-submit-btn"
              type="submit"
              className="btn-login"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* ── Demo Credentials ── */}
          <div className="demo-section">
            <p className="demo-title">Demo Credentials</p>
            <div className="demo-pills">
              <button
                className="demo-pill"
                onClick={() =>
                  fillDemo("admin@examshield.com", "Admin@123")
                }
              >
                <span className="demo-role admin">Admin</span>
                admin@examshield.com
              </button>
            </div>
            <p className="demo-hint">Click to auto-fill credentials</p>
          </div>
        </div>

        {/* ── Footer ── */}
        <p className="login-footer">
          ExamShield &copy; {new Date().getFullYear()} &bull; MCA Mini Project
        </p>
      </div>

      {/* ── Login Page CSS (scoped via className) ── */}
      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          position: relative;
          overflow: hidden;
        }

        /* Floating decorative orbs */
        .login-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          opacity: 0.35;
        }
        .orb-1 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #4f46e5, transparent);
          top: -100px; left: -100px;
          animation: orbFloat 8s ease-in-out infinite;
        }
        .orb-2 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, #7c3aed, transparent);
          bottom: -80px; right: -60px;
          animation: orbFloat 10s ease-in-out infinite reverse;
        }
        .orb-3 {
          width: 200px; height: 200px;
          background: radial-gradient(circle, #3b82f6, transparent);
          top: 50%; left: 60%;
          animation: orbFloat 12s ease-in-out infinite 2s;
        }
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(20px, -30px) scale(1.05); }
          66%       { transform: translate(-15px, 20px) scale(0.95); }
        }

        .login-container {
          width: 100%;
          max-width: 420px;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        /* Brand section */
        .login-brand {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        .brand-icon {
          width: 72px; height: 72px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          border-radius: 20px;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          box-shadow: 0 8px 32px rgba(79,70,229,0.4);
          margin-bottom: 0.25rem;
        }
        .brand-title {
          font-size: 2rem;
          font-weight: 800;
          background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
        }
        .brand-subtitle {
          font-size: 0.8rem;
          color: var(--text-muted);
          letter-spacing: 0.04em;
          margin: 0;
        }

        /* Card */
        .login-card {
          width: 100%;
          padding: 2rem;
          border-radius: 20px;
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 20px 60px rgba(0,0,0,0.4);
        }
        .login-heading {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 0.25rem;
          color: var(--text-primary);
        }
        .login-subheading {
          font-size: 0.875rem;
          color: var(--text-muted);
          margin-bottom: 1.75rem;
        }

        /* Form */
        .form-group-custom {
          margin-bottom: 1.25rem;
        }
        .form-label-custom {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }
        .input-wrapper {
          position: relative;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
          z-index: 1;
        }
        .form-control-custom {
          width: 100%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: var(--text-primary);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          font-size: 0.9rem;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }
        .form-control-custom.with-icon {
          padding-left: 2.75rem;
        }
        .form-control-custom.with-action {
          padding-right: 3rem;
        }
        .form-control-custom:focus {
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79,70,229,0.25);
          background: rgba(255,255,255,0.08);
        }
        .form-control-custom::placeholder {
          color: var(--text-muted);
        }
        .form-control-custom:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .input-action-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          transition: color 0.2s;
        }
        .input-action-btn:hover {
          color: var(--text-primary);
        }

        /* Submit Button */
        .btn-login {
          width: 100%;
          padding: 0.85rem;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          border: none;
          border-radius: 10px;
          color: #fff;
          font-size: 0.95rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          cursor: pointer;
          margin-top: 0.5rem;
          transition: all 0.25s;
          box-shadow: 0 4px 20px rgba(79,70,229,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .btn-login:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(79,70,229,0.5);
        }
        .btn-login:active:not(:disabled) { transform: translateY(0); }
        .btn-login:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        /* Demo section */
        .demo-section {
          margin-top: 1.75rem;
          padding-top: 1.25rem;
          border-top: 1px solid rgba(255,255,255,0.07);
        }
        .demo-title {
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          margin-bottom: 0.75rem;
          text-align: center;
        }
        .demo-pills {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .demo-pill {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 0.6rem 1rem;
          color: var(--text-secondary);
          font-size: 0.82rem;
          cursor: pointer;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          transition: all 0.2s;
        }
        .demo-pill:hover {
          background: rgba(79,70,229,0.12);
          border-color: rgba(79,70,229,0.3);
          color: var(--text-primary);
        }
        .demo-role {
          font-size: 0.68rem;
          font-weight: 700;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .demo-role.admin { background: rgba(79,70,229,0.2); color: #818cf8; }
        .demo-role.staff { background: rgba(16,185,129,0.2); color: #34d399; }
        .demo-role.student { background: rgba(245,158,11,0.2); color: #fbbf24; }
        .demo-hint {
          font-size: 0.72rem;
          color: var(--text-muted);
          text-align: center;
          margin-top: 0.5rem;
          margin-bottom: 0;
        }

        /* Footer */
        .login-footer {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-align: center;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default Login;
