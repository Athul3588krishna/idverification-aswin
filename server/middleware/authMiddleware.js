/**
 * middleware/authMiddleware.js
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   Exports two middleware functions used to protect API routes:
 *
 *   1. protect      → Verifies the JWT token sent in the request
 *                     header. Attaches the authenticated user
 *                     object to req.user for downstream handlers.
 *
 *   2. authorize    → A higher-order function (factory) that
 *                     accepts allowed roles and returns a
 *                     middleware that checks req.user.role.
 *
 * HOW JWT AUTHENTICATION WORKS IN THIS APP:
 *   Client sends:
 *     Authorization: Bearer <jwt_token>
 *
 *   This middleware:
 *     1. Extracts the token from the Authorization header
 *     2. Verifies the token signature using JWT_SECRET
 *     3. Decodes the payload { id, role }
 *     4. Fetches the full user from MongoDB (to check isActive)
 *     5. Attaches user to req.user
 *     6. Calls next() — route handler proceeds
 *
 * USAGE IN ROUTES:
 *   const { protect, authorize } = require('../middleware/authMiddleware');
 *
 *   // Any authenticated user:
 *   router.get('/profile', protect, getProfile);
 *
 *   // Only admin:
 *   router.post('/register', protect, authorize('admin'), registerUser);
 *
 *   // Admin or security staff:
 *   router.post('/verify', protect, authorize('admin', 'security_staff'), verify);
 * ═══════════════════════════════════════════════════════════════
 */

const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/User");

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE 1: protect
// Verifies JWT and hydrates req.user
// ═══════════════════════════════════════════════════════════════
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // ── Step 1: Extract token from Authorization header ──
  // Expected format: "Bearer eyJhbGci..."
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1]; // Get the part after "Bearer "
  }

  // ── Step 2: Reject if no token found ──
  if (!token) {
    res.status(401);
    throw new Error("Not authorized — no token provided");
  }

  // ── Step 3: Verify the token ──
  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { id: "...", role: "...", iat: ..., exp: ... }
  } catch (err) {
    res.status(401);
    // Give different messages for expired vs invalid tokens
    if (err.name === "TokenExpiredError") {
      throw new Error("Session expired — please login again");
    }
    throw new Error("Not authorized — invalid token");
  }

  // ── Step 4: Fetch the user from DB ──
  // We use select("+password") is NOT needed here — we need all fields
  // except password. The model has password select:false by default.
  const user = await User.findById(decoded.id);

  // ── Step 5: Validate user still exists and is active ──
  if (!user) {
    res.status(401);
    throw new Error("Not authorized — user no longer exists");
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error("Account has been deactivated. Contact an administrator.");
  }

  // ── Step 6: Attach user to request object ──
  req.user = user;

  next(); // Proceed to the next middleware or route handler
});

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE 2: authorize (Role-Based Access Control)
// Factory function: authorize('admin', 'security_staff')
// Returns a middleware that checks if req.user.role is allowed
// ═══════════════════════════════════════════════════════════════
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is already set by 'protect' middleware
    // This middleware must always be used AFTER protect()

    if (!req.user) {
      res.status(401);
      throw new Error("Not authorized — please login first");
    }

    const userRole = req.user.role;

    // Check if user's role is in the allowed roles list
    if (!allowedRoles.includes(userRole)) {
      res.status(403); // 403 Forbidden (authenticated but not permitted)
      throw new Error(
        `Access denied — '${userRole}' role cannot access this resource. ` +
        `Required: ${allowedRoles.join(" or ")}`
      );
    }

    next(); // Role is permitted — proceed
  };
};

module.exports = { protect, authorize };
