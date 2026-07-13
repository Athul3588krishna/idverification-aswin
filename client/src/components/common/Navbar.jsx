/**
 * components/common/Navbar.jsx
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   Renders the global navigation bar at the top of the screen.
 *   Displays the brand name, the currently logged-in user's name,
 *   a role-specific color badge, and a logout button.
 *
 * KEY FEATURES:
 *   • Responsive design that fits nicely on mobile and desktop.
 *   • Displays role badges dynamically: Admin (Indigo), Staff (Emerald), Student (Amber).
 *   • Seamlessly invokes the logout function from AuthContext to clear tokens and state.
 * ═══════════════════════════════════════════════════════════════
 */

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiLogOut, FiUser, FiShield } from "react-icons/fi";
import useAuth from "../../hooks/useAuth";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  // Helper function to return the correct class based on user role
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "admin":
        return "badge-success"; // Greenish-blue style (customized in index.css)
      case "security_staff":
        return "badge-warning"; // Amber style
      case "student":
      default:
        return "badge-danger"; // Amber-red style
    }
  };

  const formatRole = (role) => {
    if (!role) return "";
    return role.replace("_", " ").toUpperCase();
  };

  return (
    <nav className="navbar navbar-expand-lg border-bottom" style={{
      background: "var(--bg-secondary)",
      borderColor: "var(--border-color) !important",
      height: "var(--header-height)",
      zIndex: 1000,
      position: "sticky",
      top: 0
    }}>
      <div className="container-fluid px-4">
        {/* Brand Link */}
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/dashboard">
          <FiShield className="text-primary-light" size={24} style={{ color: "var(--primary-light)" }} />
          <span style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontWeight: 700,
            fontSize: "1.25rem",
            color: "var(--text-primary)",
            letterSpacing: "0.02em"
          }}>
            ExamShield
          </span>
        </Link>

        {/* User Info & Actions */}
        <div className="d-flex align-items-center gap-3">
          {user && (
            <div className="d-none d-md-flex align-items-center gap-2">
              <span className="text-secondary" style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Logged in as:
              </span>
              <span className="fw-semibold text-light" style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>
                {user.name}
              </span>
              <span className={`badge ${getRoleBadgeClass(user.role)}`} style={{ fontSize: "0.7rem", padding: "0.25rem 0.5rem" }}>
                {formatRole(user.role)}
              </span>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="btn btn-outline-danger d-flex align-items-center gap-2"
            style={{
              fontSize: "0.85rem",
              borderRadius: "var(--radius-sm)",
              padding: "0.4rem 0.8rem",
              transition: "all var(--transition-fast)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              background: "transparent",
              color: "var(--accent-red)"
            }}
            title="Log Out"
          >
            <FiLogOut size={16} />
            <span className="d-none d-sm-inline">Log Out</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
