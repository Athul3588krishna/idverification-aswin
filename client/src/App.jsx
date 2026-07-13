/**
 * App.jsx – Root Application Component
 * ---------------------------------------------------------
 * Sets up React Router with all application routes.
 * AuthContext wraps the entire tree for global auth state.
 * PrivateRoute guards protected pages.
 *
 * Route Structure:
 *   /            → Login
 *   /dashboard   → Dashboard (protected)
 *   /students    → Student List (protected)
 *   /students/add → Add Student (protected)
 *   /verify      → OCR Verification (protected)
 *   /history     → Verification History (protected)
 *   *            → 404 Not Found
 */

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";

// Context
import { AuthProvider } from "./context/AuthContext";

// Route guard
import PrivateRoute from "./components/common/PrivateRoute";

// Pages (will be fully implemented in subsequent phases)
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import AddStudent from "./pages/AddStudent";
import Verify from "./pages/Verify";
import VerificationHistory from "./pages/VerificationHistory";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/students"
            element={
              <PrivateRoute>
                <Students />
              </PrivateRoute>
            }
          />
          <Route
            path="/students/add"
            element={
              <PrivateRoute>
                <AddStudent />
              </PrivateRoute>
            }
          />
          <Route
            path="/verify"
            element={
              <PrivateRoute>
                <Verify />
              </PrivateRoute>
            }
          />
          <Route
            path="/history"
            element={
              <PrivateRoute>
                <VerificationHistory />
              </PrivateRoute>
            }
          />

          {/* 404 Catch-All */}
          <Route path="*" element={<NotFound />} />
        </Routes>

        {/* Global Toast Notifications */}
        <ToastContainer
          position="top-right"
          autoClose={3500}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          pauseOnHover
          theme="dark"
        />
      </Router>
    </AuthProvider>
  );
}

export default App;
