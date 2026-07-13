/**
 * main.jsx – React application entry point
 * ---------------------------------------------------------
 * Mounts the root React component into the DOM.
 * Imports global CSS and Bootstrap.
 */

import React from "react";
import ReactDOM from "react-dom/client";

// Global CSS (Design tokens, resets, utilities)
import "./index.css";

// Bootstrap CSS for responsive grid and base components
import "bootstrap/dist/css/bootstrap.min.css";

// React Toastify CSS
import "react-toastify/dist/ReactToastify.css";

import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
