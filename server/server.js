/**
 * ExamShield – OCR-Based Identity Verification System
 * Entry Point: server.js
 * ---------------------------------------------------------
 * Initializes Express, connects to MongoDB, and registers
 * all application routes with middleware.
 */

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables before anything else
dotenv.config();

const connectDB = require("./config/db");

// Import route handlers
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const verificationRoutes = require("./routes/verificationRoutes");

// Initialize Express application
const app = express();

// ── Middleware ──────────────────────────────────────────────
// Enable Cross-Origin Resource Sharing for the React frontend
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// Parse incoming JSON request bodies
app.use(express.json());

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: false }));

// HTTP request logger (only in development mode)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Serve uploaded images as static files
// e.g., GET /uploads/filename.jpg
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── API Routes ──────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/verify", verificationRoutes);

// ── Health Check Route ──────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "ExamShield API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── Global Error Handler ────────────────────────────────────
// Catches errors thrown by async route handlers
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  console.error(`[ERROR] ${err.message}`);
  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

// ── Start Server ────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB(); // Wait for DB connection before accepting requests
  app.listen(PORT, () => {
    console.log(
      `\n🛡️  ExamShield Server running on http://localhost:${PORT}`
    );
    console.log(`📋 Environment: ${process.env.NODE_ENV}`);
    console.log(`📡 API Base:    http://localhost:${PORT}/api\n`);
  });
};

startServer();
