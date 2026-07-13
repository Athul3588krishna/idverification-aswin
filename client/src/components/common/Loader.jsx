/**
 * components/common/Loader.jsx
 * ---------------------------------------------------------
 * Reusable loading spinner component.
 * Supports full-screen overlay mode and inline mode.
 */

import React from "react";

/**
 * Loader
 * @param {{ fullScreen?: boolean, message?: string, size?: string }} props
 */
const Loader = ({ fullScreen = false, message = "Loading...", size = "lg" }) => {
  const spinner = (
    <div className="d-flex flex-column align-items-center justify-content-center gap-3">
      {/* Animated spinner using primary brand color */}
      <div
        className="spinner-border"
        style={{
          width: size === "lg" ? "3rem" : "1.5rem",
          height: size === "lg" ? "3rem" : "1.5rem",
          color: "var(--primary-light)",
          borderWidth: "3px",
        }}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", margin: 0 }}>
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary)",
          zIndex: 9999,
        }}
      >
        {spinner}
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center justify-content-center p-4">
      {spinner}
    </div>
  );
};

export default Loader;
