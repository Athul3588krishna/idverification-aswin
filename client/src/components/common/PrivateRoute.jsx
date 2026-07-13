/**
 * components/common/PrivateRoute.jsx
 * ---------------------------------------------------------
 * Route guard component. Redirects unauthenticated users
 * to the login page. Shows a loading spinner during the
 * initial auth check to prevent flash of wrong content.
 */

import React from "react";
import { Navigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import Loader from "./Loader";

/**
 * PrivateRoute
 * @param {{ children: React.ReactNode }} props
 */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  // Wait for localStorage auth check to complete
  if (loading) {
    return <Loader fullScreen message="Authenticating..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;
