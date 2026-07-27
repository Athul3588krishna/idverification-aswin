/**
 * pages/StudentLogin.jsx
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   Portal login for exam student candidates.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiMail, FiLock, FiEye, FiEyeOff, FiShield } from "react-icons/fi";
import useAuth from "../hooks/useAuth";
import { loginAPI } from "../api/authAPI";

const StudentLogin = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Form state
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.password.trim()) {
      toast.warn("Please enter your email and password");
      return;
    }

    setIsLoading(true);
    try {
      const data = await loginAPI({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      if (data.user.role !== "student") {
        toast.error("Staff must use the Staff Login Portal!");
        setIsLoading(false);
        return;
      }

      login(data.user, data.token);
      toast.success(`Welcome, ${data.user.name}! 📚`);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed. Please check credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page gradient-bg">
      <div className="login-container animate-fade-in-up">
        {/* Brand Header */}
        <div className="login-brand">
          <div className="brand-icon">
            <FiShield size={36} />
          </div>
          <h1 className="brand-title">ExamShield</h1>
          <p className="brand-subtitle">Candidate Verification System</p>
        </div>

        {/* Login Card */}
        <div className="login-card glass-card">
          <h2 className="login-heading">Candidate Login</h2>
          <p className="login-subheading">Sign in to view your entrance exam hall ticket</p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group-custom">
              <label htmlFor="email" className="form-label-custom">Registered Email</label>
              <div className="input-wrapper">
                <span className="input-icon"><FiMail size={16} /></span>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className="form-control-custom with-icon"
                  placeholder="athul@examshield.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="form-group-custom">
              <label htmlFor="password" className="form-label-custom">Password</label>
              <div className="input-wrapper">
                <span className="input-icon"><FiLock size={16} /></span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  className="form-control-custom with-icon with-action"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  className="input-action-btn"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-login" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Login Portal"}
            </button>
          </form>

          <div className="mt-3 text-center">
            <span className="text-white-50 small">New candidate? </span>
            <Link to="/student/register" className="auth-link small" style={{ color: "#818cf8", textDecoration: "none", fontWeight: "600" }}>Register Here</Link>
          </div>

          {/* Quick-fill section */}
          <div className="mt-4 border-top border-secondary pt-3 text-center">
            <small className="text-white-50 d-block mb-2">QUICK FILL DEMO CREDENTIALS</small>
            <button
              className="btn btn-sm btn-outline-secondary text-white-50 w-100"
              onClick={() => setFormData({ email: "athul@examshield.com", password: "Student@123" })}
            >
              Demo Student (ATHUL KRISHNA)
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <Link to="/" className="text-secondary small d-inline-flex align-items-center gap-1 mb-2" style={{ textDecoration: "none" }}>
            ← Back to System Home
          </Link>
          <p className="login-footer">
            ExamShield Student Portal &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>

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
        .login-container {
          width: 100%;
          max-width: 420px;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }
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
          display: flex align-items: center; justify-content: center;
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
        .login-card {
          width: 100%;
          padding: 2rem;
          border-radius: 20px;
        }
        .login-heading {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
          text-align: center;
        }
        .login-subheading {
          font-size: 0.85rem;
          color: var(--text-muted);
          margin-bottom: 1.75rem;
          text-align: center;
        }
        .form-group-custom {
          margin-bottom: 1.25rem;
        }
        .form-label-custom {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
          letter-spacing: 0.02em;
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
          outline: none;
          transition: all 0.2s;
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
        .input-action-btn {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
        }
        .btn-login {
          width: 100%;
          padding: 0.85rem;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          border: none;
          border-radius: 10px;
          color: #fff;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          margin-top: 0.5rem;
          box-shadow: 0 4px 20px rgba(79,70,229,0.35);
        }
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

export default StudentLogin;
