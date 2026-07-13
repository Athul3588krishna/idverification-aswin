/**
 * models/User.js
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   Defines the Mongoose schema and model for all users in the
 *   ExamShield system. Supports three distinct roles — admin,
 *   security_staff, and student — each with tailored fields.
 *
 * WHY THREE ROLES?
 *   • admin         → Full system access. Registers users, views
 *                     all logs, manages students.
 *   • security_staff → Performs ID card scanning & verification
 *                     at exam entry points.
 *   • student       → Registered in the system so their ID card
 *                     data can be matched during verification.
 *
 * KEY DESIGN DECISIONS:
 *   • Password is pre-hashed via a Mongoose pre-save hook using
 *     bcryptjs so controllers never touch raw passwords.
 *   • matchPassword() method lives on the document so login logic
 *     stays clean in the controller.
 *   • student-specific fields (rollNumber, course, etc.) are only
 *     relevant when role === 'student' but stored in the same
 *     collection for simplicity (single-collection pattern).
 *   • createdBy tracks which admin created this user account.
 * ═══════════════════════════════════════════════════════════════
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ─────────────────────────────────────────────
// Sub-schema: Student Profile Details
// Only populated when role === 'student'
// ─────────────────────────────────────────────
const studentProfileSchema = new mongoose.Schema(
  {
    rollNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    course: {
      type: String,
      trim: true, // e.g., "MCA", "BCA", "B.Tech CSE"
    },
    semester: {
      type: Number,
      min: 1,
      max: 10,
    },
    examCenter: {
      type: String,
      trim: true, // e.g., "Hall A – Room 204"
    },
    department: {
      type: String,
      trim: true,
    },
    admissionYear: {
      type: Number,
    },
    idCardImageUrl: {
      type: String,
      default: null, // Path to uploaded reference ID card image
    },
  },
  { _id: false } // No separate _id for the sub-document
);

// ─────────────────────────────────────────────
// Main User Schema
// ─────────────────────────────────────────────
const userSchema = new mongoose.Schema(
  {
    // ── Core identity fields (all roles) ──
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [80, "Name cannot exceed 80 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,  // Enforced at DB level with a unique index
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // NEVER returned in queries unless explicitly requested
    },

    phone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, "Phone number must be exactly 10 digits"],
      default: null,
    },

    // ── Role-based access control ──
    role: {
      type: String,
      enum: {
        values: ["admin", "security_staff", "student"],
        message: "Role must be one of: admin, security_staff, student",
      },
      default: "student",
    },

    // ── Student-specific profile (only used when role === 'student') ──
    studentProfile: {
      type: studentProfileSchema,
      default: null,
    },

    // ── Account state ──
    isActive: {
      type: Boolean,
      default: true, // Admins can deactivate accounts without deleting
    },

    // ── Audit: who created this account ──
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // References another User document (the admin)
      default: null,
    },

    // ── Password reset support (future-use) ──
    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },

    // ── Last login tracking ──
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

// ═══════════════════════════════════════════════════════════════
// PRE-SAVE HOOK: Hash password before saving to database
// ═══════════════════════════════════════════════════════════════
// This runs BEFORE every .save() call.
// It only re-hashes if the password field was actually modified,
// preventing double-hashing on profile updates.
userSchema.pre("save", async function (next) {
  // If password wasn't changed, skip hashing
  if (!this.isModified("password")) return next();

  // Generate a salt (cost factor 12 = good security/speed balance)
  const salt = await bcrypt.genSalt(12);

  // Replace the plain-text password with the hashed version
  this.password = await bcrypt.hash(this.password, salt);

  next();
});

// ═══════════════════════════════════════════════════════════════
// INSTANCE METHOD: Compare submitted password with stored hash
// ═══════════════════════════════════════════════════════════════
// Called as: await user.matchPassword("plaintext")
// Returns: Boolean — true if match, false if not
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// ═══════════════════════════════════════════════════════════════
// INSTANCE METHOD: Return a safe public profile (no password)
// ═══════════════════════════════════════════════════════════════
userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.passwordResetToken;
  delete obj.passwordResetExpires;
  return obj;
};

// ═══════════════════════════════════════════════════════════════
// INDEXES: For fast queries
// ═══════════════════════════════════════════════════════════════
userSchema.index({ role: 1 });             // Filter users by role
userSchema.index({ "studentProfile.rollNumber": 1 }); // OCR roll-number lookup

const User = mongoose.model("User", userSchema);

module.exports = User;
