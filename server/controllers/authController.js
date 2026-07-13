/**
 * controllers/authController.js
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   Contains all controller functions that handle authentication
 *   and user management business logic:
 *
 *   ┌─────────────────────────────────────────────────────────┐
 *   │  Function          │ Route              │ Access        │
 *   ├─────────────────────────────────────────────────────────┤
 *   │  loginUser         │ POST /auth/login   │ Public        │
 *   │  registerUser      │ POST /auth/register│ Admin only    │
 *   │  getMe             │ GET  /auth/me      │ Any logged-in │
 *   │  updateProfile     │ PUT  /auth/me      │ Any logged-in │
 *   │  changePassword    │ PUT  /auth/password│ Any logged-in │
 *   │  getAllUsers        │ GET  /auth/users   │ Admin only    │
 *   │  getUserById       │ GET  /auth/users/:id│ Admin only   │
 *   │  updateUserStatus  │ PUT  /auth/users/:id│ Admin only   │
 *   │  deleteUser        │ DELETE /auth/users/:id│ Admin only │
 *   └─────────────────────────────────────────────────────────┘
 *
 * WHY asyncHandler?
 *   Wrapping each function with asyncHandler() automatically
 *   catches any thrown errors and passes them to the Express
 *   global error handler in server.js — no try/catch needed.
 *
 * RESPONSE FORMAT:
 *   All responses follow a consistent shape:
 *   { success: true/false, message: "...", data: {...} }
 * ═══════════════════════════════════════════════════════════════
 */

const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// ═══════════════════════════════════════════════════════════════
// @desc    Login a user (any role)
// @route   POST /api/auth/login
// @access  Public
// ═══════════════════════════════════════════════════════════════
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // ── Input Validation ──
  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide both email and password");
  }

  // ── Find user by email (include password since select:false) ──
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password"
  );

  if (!user) {
    res.status(401);
    // Generic message — don't tell attacker "email not found"
    throw new Error("Invalid email or password");
  }

  // ── Check account is active ──
  if (!user.isActive) {
    res.status(403);
    throw new Error("Your account has been deactivated. Contact an admin.");
  }

  // ── Verify password using bcrypt comparison ──
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  // ── Update last login timestamp ──
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // ── Generate JWT for this session ──
  const token = generateToken(user);

  // ── Send response ──
  res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    user: user.toPublicJSON(), // Strips password and reset fields
  });
});

// ═══════════════════════════════════════════════════════════════
// @desc    Register a new user (admin creates all accounts)
// @route   POST /api/auth/register
// @access  Private — Admin only
// ═══════════════════════════════════════════════════════════════
// Design rationale: Students and staff don't self-register.
// An admin creates their accounts and assigns credentials.
// This prevents unauthorized users from accessing the system.
// ═══════════════════════════════════════════════════════════════
const registerUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    role,
    // Student-specific fields
    rollNumber,
    course,
    semester,
    examCenter,
    department,
    admissionYear,
  } = req.body;

  // ── Validate required fields ──
  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error("Name, email, password, and role are required");
  }

  // ── Validate role value ──
  const validRoles = ["admin", "security_staff", "student"];
  if (!validRoles.includes(role)) {
    res.status(400);
    throw new Error(`Invalid role. Must be one of: ${validRoles.join(", ")}`);
  }

  // ── Check for duplicate email ──
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(409); // 409 Conflict
    throw new Error("An account with this email already exists");
  }

  // ── Build student profile if role is student ──
  let studentProfile = null;
  if (role === "student") {
    if (!rollNumber || !course) {
      res.status(400);
      throw new Error("Roll number and course are required for student accounts");
    }

    // Check for duplicate roll number
    const existingRoll = await User.findOne({
      "studentProfile.rollNumber": rollNumber.toUpperCase(),
    });
    if (existingRoll) {
      res.status(409);
      throw new Error(`Roll number '${rollNumber}' is already registered`);
    }

    studentProfile = {
      rollNumber,
      course,
      semester: semester || null,
      examCenter: examCenter || null,
      department: department || null,
      admissionYear: admissionYear || null,
    };
  }

  // ── Create the user document ──
  // Password hashing happens automatically via the pre-save hook
  const user = await User.create({
    name,
    email,
    password,        // Will be hashed by pre-save hook
    phone: phone || null,
    role,
    studentProfile,
    createdBy: req.user._id, // The admin who performed this action
    isActive: true,
  });

  res.status(201).json({
    success: true,
    message: `${role.replace("_", " ")} account created successfully`,
    user: user.toPublicJSON(),
  });
});

// ═══════════════════════════════════════════════════════════════
// @desc    Get the currently authenticated user's own profile
// @route   GET /api/auth/me
// @access  Private — any authenticated user
// ═══════════════════════════════════════════════════════════════
const getMe = asyncHandler(async (req, res) => {
  // req.user is already populated by protect middleware
  // Re-query to get the freshest data with population
  const user = await User.findById(req.user._id).populate(
    "createdBy",
    "name email role"
  );

  res.status(200).json({
    success: true,
    user: user.toPublicJSON(),
  });
});

// ═══════════════════════════════════════════════════════════════
// @desc    Update own profile (name, phone)
// @route   PUT /api/auth/me
// @access  Private — any authenticated user
// ═══════════════════════════════════════════════════════════════
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  // Only update provided fields
  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;

  const updatedUser = await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: updatedUser.toPublicJSON(),
  });
});

// ═══════════════════════════════════════════════════════════════
// @desc    Change own password
// @route   PUT /api/auth/password
// @access  Private — any authenticated user
// ═══════════════════════════════════════════════════════════════
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error("Both current password and new password are required");
  }

  if (newPassword.length < 6) {
    res.status(400);
    throw new Error("New password must be at least 6 characters");
  }

  // Fetch user WITH password (it's select:false by default)
  const user = await User.findById(req.user._id).select("+password");

  // Verify current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    res.status(401);
    throw new Error("Current password is incorrect");
  }

  // Assign new password — pre-save hook will hash it
  user.password = newPassword;
  await user.save();

  // Issue a fresh token after password change
  const token = generateToken(user);

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
    token, // Fresh token
  });
});

// ═══════════════════════════════════════════════════════════════
// @desc    Get all users (with optional role filter & search)
// @route   GET /api/auth/users?role=student&search=john&page=1&limit=10
// @access  Private — Admin only
// ═══════════════════════════════════════════════════════════════
const getAllUsers = asyncHandler(async (req, res) => {
  const {
    role,
    search,
    page = 1,
    limit = 20,
    isActive,
  } = req.query;

  // ── Build query filter ──
  const filter = {};

  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === "true";

  // Text search on name or email
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },   // case-insensitive
      { email: { $regex: search, $options: "i" } },
      { "studentProfile.rollNumber": { $regex: search, $options: "i" } },
    ];
  }

  // ── Pagination ──
  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 }) // Newest first
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    users,
  });
});

// ═══════════════════════════════════════════════════════════════
// @desc    Get a single user by ID
// @route   GET /api/auth/users/:id
// @access  Private — Admin only
// ═══════════════════════════════════════════════════════════════
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password")
    .populate("createdBy", "name email role");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    success: true,
    user,
  });
});

// ═══════════════════════════════════════════════════════════════
// @desc    Activate or deactivate a user account
// @route   PUT /api/auth/users/:id/status
// @access  Private — Admin only
// ═══════════════════════════════════════════════════════════════
const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  if (isActive === undefined) {
    res.status(400);
    throw new Error("isActive (true/false) is required");
  }

  // Prevent admin from deactivating their own account
  if (req.params.id === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot deactivate your own account");
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  user.isActive = isActive;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: `Account has been ${isActive ? "activated" : "deactivated"}`,
    user: user.toPublicJSON(),
  });
});

// ═══════════════════════════════════════════════════════════════
// @desc    Delete a user account permanently
// @route   DELETE /api/auth/users/:id
// @access  Private — Admin only
// ═══════════════════════════════════════════════════════════════
const deleteUser = asyncHandler(async (req, res) => {
  // Prevent self-deletion
  if (req.params.id === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot delete your own account");
  }

  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: "User account deleted successfully",
  });
});

// ── Export all controller functions ──
module.exports = {
  loginUser,
  registerUser,
  getMe,
  updateProfile,
  changePassword,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
};
