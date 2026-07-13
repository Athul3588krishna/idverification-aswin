/**
 * pages/NotFound.jsx
 * ---------------------------------------------------------
 * 404 Not Found page with navigation back to home.
 */

import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div
      className="gradient-bg"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "1.5rem",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      <h1 style={{ fontSize: "6rem", fontWeight: 800, color: "var(--primary-light)", margin: 0 }}>
        404
      </h1>
      <h2 style={{ color: "var(--text-primary)" }}>Page Not Found</h2>
      <p style={{ color: "var(--text-muted)", maxWidth: 400 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        className="btn btn-primary-custom"
        style={{
          background: "linear-gradient(135deg, var(--primary), var(--primary-light))",
          color: "#fff",
          padding: "0.75rem 2rem",
          borderRadius: "var(--radius-md)",
          fontWeight: 600,
          textDecoration: "none",
        }}
      >
        ← Back to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
