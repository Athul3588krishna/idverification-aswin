/**
 * routes/authRoutes.js
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   Maps HTTP methods + URL paths to their controller functions,
 *   and wires up the appropriate middleware chain for each route.
 *
 * ROUTE TABLE:
 * ┌────────────────────────────────────────────────────────────┐
 * │ Method │ Path                    │ Access                  │
 * ├────────────────────────────────────────────────────────────┤
 * │ POST   │ /api/auth/login         │ Public                  │
 * │ POST   │ /api/auth/register      │ Admin only              │
 * │ GET    │ /api/auth/me            │ Any logged-in user      │
 * │ PUT    │ /api/auth/me            │ Any logged-in user      │
 * │ PUT    │ /api/auth/password      │ Any logged-in user      │
 * │ GET    │ /api/auth/users         │ Admin only              │
 * │ GET    │ /api/auth/users/:id     │ Admin only              │
 * │ PUT    │ /api/auth/users/:id/status │ Admin only           │
 * │ DELETE │ /api/auth/users/:id     │ Admin only              │
 * └────────────────────────────────────────────────────────────┘
 *
 * MIDDLEWARE CHAIN EXPLAINED:
 *   protect           → Verifies JWT, populates req.user
 *   authorize('admin')→ Checks req.user.role === 'admin'
 *
 *   Example: protect → authorize('admin') → registerUser
 *   If token invalid → 401 (protect blocks)
 *   If not admin     → 403 (authorize blocks)
 *   If all OK        → registerUser runs
 * ═══════════════════════════════════════════════════════════════
 */

const express = require("express");
const router = express.Router();

const {
  loginUser,
  registerUser,
  getMe,
  updateProfile,
  changePassword,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
} = require("../controllers/authController");

const { protect, authorize } = require("../middleware/authMiddleware");

// ────────────────────────────────────────────
// PUBLIC ROUTES (no authentication required)
// ────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Accepts: { email, password }
 * Returns: { token, user }
 * Any user (admin, security_staff, student) can login here.
 */
router.post("/login", loginUser);

// ────────────────────────────────────────────
// PROTECTED ROUTES — Any authenticated user
// ────────────────────────────────────────────

/**
 * GET  /api/auth/me  → Get own profile
 * PUT  /api/auth/me  → Update own profile (name, phone)
 */
router
  .route("/me")
  .get(protect, getMe)
  .put(protect, updateProfile);

/**
 * PUT /api/auth/password → Change own password
 * Accepts: { currentPassword, newPassword }
 */
router.put("/password", protect, changePassword);

// ────────────────────────────────────────────
// PROTECTED ROUTES — Admin only
// ────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Admin creates new accounts for staff or students.
 * Accepts: { name, email, password, role, phone, ...studentFields }
 */
router.post("/register", protect, authorize("admin"), registerUser);

/**
 * GET /api/auth/users
 * List all users with optional filters:
 *   ?role=student&search=john&page=1&limit=10&isActive=true
 */
router.get("/users", protect, authorize("admin"), getAllUsers);

/**
 * GET    /api/auth/users/:id  → Get user by ID
 * DELETE /api/auth/users/:id  → Delete user permanently
 */
router
  .route("/users/:id")
  .get(protect, authorize("admin"), getUserById)
  .delete(protect, authorize("admin"), deleteUser);

/**
 * PUT /api/auth/users/:id/status
 * Toggle isActive field: { isActive: true/false }
 */
router.put(
  "/users/:id/status",
  protect,
  authorize("admin"),
  updateUserStatus
);

module.exports = router;
