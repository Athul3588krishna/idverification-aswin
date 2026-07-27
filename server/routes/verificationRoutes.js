/**
 * routes/verificationRoutes.js
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   Registers verification API routes under `/api/verify` namespace.
 *
 * ENDPOINTS:
 *   • POST /api/verify/scan  → Uploads student card image, extracts details via
 *                              Tesseract OCR, matches against CSV student dataset.
 *   • GET  /api/verify/logs  → Fetches paginated scan audit history.
 *   • GET  /api/verify/stats → Retrieves aggregated scanning statistics.
 * ═══════════════════════════════════════════════════════════════
 */

const express = require("express");
const router = express.Router();

const {
  verifyStudentCard,
  getVerificationLogs,
  getStats
} = require("../controllers/verificationController");

const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// ── Route: Perform Identity Card OCR Verification Scan ──
// Accepts image in multi-part form data with key name "idCard"
router.post(
  "/scan",
  protect,
  authorize("admin", "security_staff"),
  upload.single("idCard"),
  verifyStudentCard
);

// ── Route: Query Paginated Scanning Logs ──
router.get(
  "/logs",
  protect,
  authorize("admin", "security_staff"),
  getVerificationLogs
);

// ── Route: Fetch Verification Analytics ──
router.get(
  "/stats",
  protect,
  authorize("admin", "security_staff"),
  getStats
);

module.exports = router;
