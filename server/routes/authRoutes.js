/**
 * routes/authRoutes.js
 * ---------------------------------------------------------
 * Authentication routes: admin register and login.
 * Full implementation will be added in Phase 2.
 */

const express = require("express");
const router = express.Router();

// Placeholder – will be replaced with real controller in Phase 2
router.get("/", (req, res) => {
  res.json({ message: "Auth routes ready. Phase 2 implementation pending." });
});

module.exports = router;
