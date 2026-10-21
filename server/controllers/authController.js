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
    // Say the mail is not found

    throw new Error("Invalid email or password");
  }

  // ── Check account is active (for admin and staff, inactive means deactivated. For students, inactive means pending approval, which is handled in frontend) ──
  if (!user.isActive && user.role !== "student") {
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
    dob,
    idNumber,
    examSubject,
    examDate,
    examTime
  } = req.body;

  // ── Validate required fields ──
  if (!name || !email || !password || !role) {
    res.status(400);
    throw new Error("Name, email, password, and role are required");
  }

  // ── Validate name (alphabets and spaces only) ──
  const nameRegex = /^[a-zA-Z\s]+$/;
  if (!nameRegex.test(name.trim())) {
    res.status(400);
    throw new Error("Name must contain only alphabets and spaces");
  }

  // ── Validate role value ──
  const validRoles = ["admin", "security_staff", "student"];
  if (!validRoles.includes(role)) {
    res.status(400);
    throw new Error(`Invalid role. Must be one of: ${validRoles.join(", ")}`);
  }

  // ── Validate optional phone number format (10 digits) ──
  if (phone && phone.trim()) {
    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      res.status(400);
      throw new Error("Phone number must be exactly 10 numeric digits");
    }
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

    if (!phone || !phone.trim()) {
      res.status(400);
      throw new Error("Phone number is required for student accounts");
    }

    if (idNumber) {
      const cleanIdNumber = idNumber.trim().replace(/\D/g, "");
      if (cleanIdNumber.length !== 12) {
        res.status(400);
        throw new Error("Aadhaar number must be exactly 12 numeric digits");
      }
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
      rollNumber: rollNumber.toUpperCase(),
      course,
      semester: semester || null,
      examCenter: examCenter || null,
      department: department || null,
      admissionYear: admissionYear || null,
      dob: dob || "",
      idNumber: idNumber || "",
      examSubject: examSubject || "Entrance Examination 2026",
      examDate: examDate || "2026-08-15",
      examTime: examTime || "10:00 AM - 1:00 PM",
      photoUrl: req.file ? `/uploads/${req.file.filename}` : null,
      idCardImageUrl: req.file ? `/uploads/${req.file.filename}` : null
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

  if (role === "student") {
    try {
      const { emitEvent } = require("../utils/socket");
      emitEvent("student_status_updated", {
        newStudent: true,
        userId: user._id,
        isActive: user.isActive,
        email: user.email
      });
    } catch (err) {
      console.error("Socket emit error:", err.message);
    }
  }

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
  if (name) {
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(name.trim())) {
      res.status(400);
      throw new Error("Name must contain only alphabets and spaces");
    }
    user.name = name.trim();
  }
  if (phone !== undefined) {
    if (phone && phone.trim()) {
      const cleanPhone = phone.trim().replace(/\D/g, "");
      if (cleanPhone.length !== 10) {
        res.status(400);
        throw new Error("Phone number must be exactly 10 numeric digits");
      }
      user.phone = cleanPhone;
    } else {
      user.phone = null;
    }
  }

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

  // When admin approves/activates a student candidate, allocate exam date, time, hall, and desk if not already assigned
  if (isActive && user.role === "student") {
    if (!user.studentProfile) user.studentProfile = {};
    user.studentProfile.adminVerified = true;
    user.studentProfile.adminVerifiedAt = new Date();

    if (!user.studentProfile.examDate || user.studentProfile.examDate.includes("Pending")) {
      user.studentProfile.examDate = "2026-08-10";
    }

    if (!user.studentProfile.examTime || user.studentProfile.examTime.includes("Pending")) {
      user.studentProfile.examTime = "10:00 AM - 1:00 PM";
    }

    if (!user.studentProfile.allocatedHall || user.studentProfile.allocatedHall.includes("Pending")) {
      const halls = [
        "Block A - Room 101",
        "Block A - Room 102",
        "Block B - Room 201",
        "Block B - Room 204",
        "Block C - Room 301",
        "Block C - Room 302",
        "Block D - Room 401",
        "Lab 1 - Ground Floor",
        "Lab 2 - First Floor"
      ];
      user.studentProfile.allocatedHall = halls[Math.floor(Math.random() * halls.length)];
    }

    if (!user.studentProfile.allocatedSeat || user.studentProfile.allocatedSeat.includes("Pending")) {
      user.studentProfile.allocatedSeat = `Desk #${Math.floor(Math.random() * 30) + 1}`;
    }

    if (!user.studentProfile.examCenter || user.studentProfile.examCenter.includes("Pending")) {
      user.studentProfile.examCenter = "State University Main Examination Complex";
    }
  }

  await user.save({ validateBeforeSave: false });

  // Emit real-time status update via Socket.io
  try {
    const { emitEvent } = require("../utils/socket");
    emitEvent("student_status_updated", {
      userId: user._id,
      email: user.email,
      isActive: user.isActive,
      allocatedHall: user.studentProfile?.allocatedHall,
      allocatedSeat: user.studentProfile?.allocatedSeat,
      examDate: user.studentProfile?.examDate,
      examTime: user.studentProfile?.examTime,
      user: user.toPublicJSON()
    });
  } catch (err) {
    console.error("Socket emit error:", err.message);
  }

  // Send candidate approval notification via Telegram & Email
  if (isActive && user.role === "student") {
    // 1. Telegram Notification (notifies student of Exam Date, Room, Time, Desk)
    try {
      const { sendTelegramApprovalNotification } = require("../utils/telegram");
      sendTelegramApprovalNotification({
        chatId: user.studentProfile?.telegramChatId,
        studentName: user.name,
        rollNumber: user.studentProfile?.rollNumber || "N/A",
        course: user.studentProfile?.course,
        examSubject: user.studentProfile?.examSubject || "Entrance Examination 2026",
        examDate: user.studentProfile?.examDate || "2026-08-10",
        examTime: user.studentProfile?.examTime || "10:00 AM - 1:00 PM",
        allocatedHall: user.studentProfile?.allocatedHall || "Block B - Room 204",
        allocatedSeat: user.studentProfile?.allocatedSeat || "Desk #18",
        examCenter: user.studentProfile?.examCenter || "State University Main Examination Complex"
      }).catch((err) => console.warn("[Telegram Notification Error]:", err.message));
    } catch (err) {
      console.warn("[Telegram Notification Setup Error]:", err.message);
    }

    // 2. Email Notification
    try {
      const { sendApprovalEmail } = require("../utils/mailer");
      sendApprovalEmail(
        user.email,
        user.name,
        user.studentProfile?.rollNumber || "N/A",
        user.studentProfile?.allocatedHall || "Block B - Room 204",
        user.studentProfile?.allocatedSeat || "Desk #18",
        user.studentProfile?.examSubject
      ).catch((err) => console.warn("[Approval Email Error]:", err.message));
    } catch (err) {
      console.warn("[Approval Email Setup Error]:", err.message);
    }
  }

  res.status(200).json({
    success: true,
    message: isActive
      ? `Candidate approved! Hall (${user.studentProfile?.allocatedHall || "Block B"}), ${user.studentProfile?.allocatedSeat || "Desk #18"}, and exam schedule sent via Telegram & Email.`
      : "Candidate account has been deactivated / barred.",
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

// ═══════════════════════════════════════════════════════════════
// @desc    Self-register a new student (Public)
// @route   POST /api/auth/student-register
// @access  Public
// ═══════════════════════════════════════════════════════════════
const studentRegister = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    rollNumber,
    course,
    semester,
    dob,
    idNumber,
    examSubject,
    examDate,
    examTime,
    examCenter,
    otp
  } = req.body;

  // Always force role to be 'student' for public registration
  const targetRole = "student";

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email, and password are required");
  }

  // Validate name (alphabets and spaces only)
  const nameRegex = /^[a-zA-Z\s]+$/;
  if (!nameRegex.test(name.trim())) {
    res.status(400);
    throw new Error("Full Name must contain only alphabets and spaces");
  }

  // Check for duplicate email
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    res.status(409);
    throw new Error("An account with this email already exists");
  }

  if (!phone || !phone.trim() || !rollNumber || !course || !dob || !idNumber || !otp) {
    res.status(400);
    throw new Error("Name, email, password, phone number, roll number, course, DOB, ID number, and OTP are required for student registration");
  }

  // Validate required phone number format (10 digits)
  const cleanPhone = phone.trim().replace(/\D/g, "");
  if (cleanPhone.length !== 10) {
    res.status(400);
    throw new Error("Phone number must be exactly 10 numeric digits");
  }

  // Validate 12-digit Aadhaar number format
  const cleanIdNumber = idNumber ? idNumber.trim().replace(/\D/g, "") : "";
  if (cleanIdNumber.length !== 12) {
    res.status(400);
    throw new Error("Aadhaar number must be exactly 12 numeric digits");
  }

  // Verify OTP code
  const { verifyOTP } = require("../utils/otpStore");
  if (!verifyOTP(email, otp)) {
    res.status(400);
    throw new Error("Invalid or expired OTP verification code");
  }

  // Check for duplicate roll number
  const existingRoll = await User.findOne({
    "studentProfile.rollNumber": rollNumber.toUpperCase(),
  });
  if (existingRoll) {
    res.status(409);
    throw new Error(`Roll number '${rollNumber}' is already registered`);
  }

  const { getAutoApprove } = require("../utils/systemConfig");
  const isAutoApproved = getAutoApprove();

  // Handle uploaded files: studentPhoto (for Admit Card) and idCardImage (for OCR & verification)
  const files = req.files || (req.file ? [req.file] : []);
  const studentPhotoFile = files.find(
    (f) => f.fieldname === "studentPhoto" || f.fieldname === "photo"
  );
  const idCardFile = files.find(
    (f) => f.fieldname === "idCardImage" || f.fieldname === "idCard"
  );

  const cleanRoll = rollNumber.toUpperCase();
  const fs = require("fs");
  const path = require("path");
  const samplePhotoPath = path.join(__dirname, `../uploads/photo_${cleanRoll}.png`);
  const hasSamplePhoto = fs.existsSync(samplePhotoPath);

  const photoUrl = studentPhotoFile
    ? `/uploads/${studentPhotoFile.filename}`
    : (hasSamplePhoto
        ? `/uploads/photo_${cleanRoll}.png`
        : (idCardFile ? `/uploads/${idCardFile.filename}` : null));

  const idCardImageUrl = idCardFile
    ? `/uploads/${idCardFile.filename}`
    : (studentPhotoFile ? `/uploads/${studentPhotoFile.filename}` : null);

  const studentProfile = {
    rollNumber: cleanRoll,
    course,
    semester: Math.min(Math.max(Number(semester) || 1, 1), 20),
    dob,
    idNumber,
    telegramChatId: req.body.telegramChatId ? req.body.telegramChatId.trim() : "",
    examSubject: examSubject || "Entrance Examination 2026",
    examDate: isAutoApproved ? (examDate || "2026-08-10") : "",
    examTime: isAutoApproved ? (examTime || "10:00 AM - 1:00 PM") : "",
    examCenter: examCenter || "Main University Campus",
    allocatedHall: isAutoApproved ? (req.body.allocatedHall || "Block B - Room 204") : "",
    allocatedSeat: isAutoApproved ? (req.body.allocatedSeat || `Desk #${Math.floor(Math.random() * 30) + 1}`) : "",
    adminVerified: isAutoApproved,
    adminVerifiedAt: isAutoApproved ? new Date() : null,
    checkInStatus: "NOT_ARRIVED",
    checkInTime: null,
    qrToken: `EXAM-${cleanRoll}-2026`,
    photoUrl,
    idCardImageUrl
  };

  const user = await User.create({
    name,
    email,
    password,
    phone: cleanPhone,
    role: targetRole,
    studentProfile,
    isActive: isAutoApproved,
  });

  try {
    const { emitEvent } = require("../utils/socket");
    emitEvent("student_status_updated", {
      newStudent: true,
      userId: user._id,
      isActive: user.isActive,
      email: user.email
    });
  } catch (err) {
    console.error("Socket emit error:", err.message);
  }

  res.status(201).json({
    success: true,
    message: isAutoApproved
      ? "Registration successful! Account automatically approved. Log in to access your admit card."
      : "Registration successful! Pending Admin approval. Your Exam Date, Room, and Time will be notified via Telegram upon approval.",
    user: user.toPublicJSON(),
  });
});

// ═══════════════════════════════════════════════════════════════
// @desc    Generate and Send OTP to candidate email
// @route   POST /api/auth/send-otp
// @access  Public
// ═══════════════════════════════════════════════════════════════
const sendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error("Please provide an email address");
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    res.status(409);
    throw new Error("An account with this email already exists");
  }

  const { generateOTP, saveOTP } = require("../utils/otpStore");
  const { sendOTPEmail } = require("../utils/mailer");

  const otpCode = generateOTP();
  saveOTP(email, otpCode);

  try {
    await sendOTPEmail(email.toLowerCase().trim(), otpCode);
    res.status(200).json({
      success: true,
      message: `Verification code sent to ${email}`
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
});

// ═══════════════════════════════════════════════════════════════
// @desc    Upload or update candidate student photo
// @route   PUT /api/auth/me/photo
// @access  Private — authenticated student
// ═══════════════════════════════════════════════════════════════
const uploadStudentPhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Please select an image file to upload");
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const photoUrl = `/uploads/${req.file.filename}`;
  if (!user.studentProfile) {
    user.studentProfile = {};
  }
  user.studentProfile.photoUrl = photoUrl;
  user.studentProfile.idCardImageUrl = photoUrl;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Candidate photo updated successfully",
    photoUrl,
    user: user.toPublicJSON(),
  });
});

// ═══════════════════════════════════════════════════════════════
// @desc    Extract student details from uploaded ID card using OCR
// @route   POST /api/auth/extract-id
// @access  Public
// ═══════════════════════════════════════════════════════════════
const extractIdCardDetails = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error("Please select an ID card image to scan");
  }

  const { performOCR, parseIdCardText } = require("../utils/ocrUtils");
  const fs = require("fs");

  try {
    const rawText = await performOCR(req.file.path);
    const extracted = parseIdCardText(rawText);

    // Clean up temporary scan file to preserve disk space
    fs.unlink(req.file.path, (err) => {
      if (err) console.warn("[OCR Cleanup] Could not remove temp file:", err.message);
    });

    res.status(200).json({
      success: true,
      message: "ID Card text extracted successfully",
      extracted,
      rawTextLength: rawText.length,
    });
  } catch (error) {
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, () => {});
    }
    res.status(500);
    throw new Error(`OCR Extraction failed: ${error.message}`);
  }
});

// ── Export all controller functions ──
module.exports = {
  loginUser,
  registerUser,
  studentRegister,
  sendOTP,
  getMe,
  updateProfile,
  changePassword,
  getAllUsers,
  getUserById,
  updateUserStatus,
  deleteUser,
  uploadStudentPhoto,
  extractIdCardDetails,
};
