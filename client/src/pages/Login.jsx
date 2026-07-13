/**
 * pages/Login.jsx
 * ---------------------------------------------------------
 * Admin login page. Full implementation in Phase 2.
 */

import React from "react";

const Login = () => {
  return (
    <div
      className="gradient-bg"
      style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div className="glass-card text-center" style={{ maxWidth: 400, width: "100%" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
          🛡️ ExamShield
        </h1>
        <p style={{ color: "var(--text-muted)" }}>Phase 2: Auth coming soon</p>
      </div>
    </div>
  );
};

export default Login;
