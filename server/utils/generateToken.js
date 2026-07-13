/**
 * utils/generateToken.js
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   A single-purpose utility that creates a signed JWT (JSON Web
 *   Token) for a given user.
 *
 * WHY A SEPARATE UTILITY?
 *   Keeping token generation in one place means:
 *   • Any change to the token structure (adding claims, changing
 *     expiry) is made in exactly ONE file.
 *   • Controllers stay clean — they just call generateToken(user).
 *   • Easy to unit test in isolation.
 *
 * JWT PAYLOAD (what gets encoded inside the token):
 *   { id, role }
 *   • id   → MongoDB ObjectId — used to look up the user in DB
 *   • role → "admin" | "security_staff" | "student"
 *            Used in authMiddleware for role-based checks WITHOUT
 *            hitting the database on every request.
 *
 * SECURITY NOTE:
 *   The JWT_SECRET in .env must be a long, random string.
 *   Anyone with the secret can forge tokens, so NEVER commit it.
 * ═══════════════════════════════════════════════════════════════
 */

const jwt = require("jsonwebtoken");

/**
 * generateToken
 * @param {Object} user - Mongoose User document
 * @param {string} user._id  - MongoDB ObjectId
 * @param {string} user.role - "admin" | "security_staff" | "student"
 * @returns {string} Signed JWT string
 */
const generateToken = (user) => {
  return jwt.sign(
    // ── Payload ── (do NOT include sensitive data here)
    {
      id: user._id,
      role: user.role,
    },

    // ── Secret key from environment variable ──
    process.env.JWT_SECRET,

    // ── Options ──
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d", // Token expires in 7 days
      issuer: "examshield-api",                       // Identifies the issuing system
    }
  );
};

module.exports = generateToken;
