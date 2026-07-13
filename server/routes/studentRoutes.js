/**
 * routes/studentRoutes.js
 * ---------------------------------------------------------
 * Student management routes: CRUD operations.
 * Full implementation will be added in Phase 3.
 */

const express = require("express");
const router = express.Router();

// Placeholder – will be replaced with real controller in Phase 3
router.get("/", (req, res) => {
  res.json({ message: "Student routes ready. Phase 3 implementation pending." });
});

module.exports = router;
