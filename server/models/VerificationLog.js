/**
 * models/VerificationLog.js
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   Defines the Mongoose schema and model to keep an audit trail
 *   of every candidate entry scan attempt.
 *
 * WHY IS THIS CRITICAL?
 *   • Security Auditing: Tracks who entered, when they entered, and which
 *     gate security officer approved/rejected them.
 *   • Match Evidence: Stores OCR-extracted raw text, computed match
 *     percentages, and the photo used so administrators can audit anomalies.
 *   • Performance Metrics: Provides the underlying data for dashboard counters.
 * ═══════════════════════════════════════════════════════════════
 */

const mongoose = require("mongoose");

const verificationLogSchema = new mongoose.Schema(
  {
    // ── Link to Student Account (if matching roll number exists) ──
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null // Will be null if candidate card roll is invalid/not in DB
    },

    // ── Raw data extracted by Tesseract OCR ──
    scannedRollNumber: {
      type: String,
      trim: true,
      default: ""
    },

    scannedName: {
      type: String,
      trim: true,
      default: ""
    },

    rawOcrText: {
      type: String,
      default: ""
    },

    // ── Snapshot of matched details for audit ──
    matchedDetails: {
      name: { type: String, default: "" },
      rollNumber: { type: String, default: "" },
      course: { type: String, default: "" },
      examCenter: { type: String, default: "" }
    },

    // ── Match quality score (0 to 100) ──
    matchPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0
    },

    // ── Decision status ──
    status: {
      type: String,
      required: true,
      enum: {
        values: ["APPROVED", "REJECTED"],
        message: "Status must be either APPROVED or REJECTED"
      }
    },

    // ── Verification method ──
    verificationType: {
      type: String,
      enum: ["OCR_ID_CARD", "QR_HALL_TICKET", "MANUAL_OVERRIDE"],
      default: "OCR_ID_CARD"
    },

    // ── Anti-passback tracking ──
    isDuplicateEntry: {
      type: Boolean,
      default: false
    },

    // ── Allocated Exam Room / Seat for this record ──
    allocatedHall: {
      type: String,
      trim: true,
      default: ""
    },
    allocatedSeat: {
      type: String,
      trim: true,
      default: ""
    },

    // ── Reason for denial (if rejected) ──
    rejectionReason: {
      type: String,
      trim: true,
      default: "" // e.g. "Candidate roll number not registered", "Duplicate entry detected", "Suspended permit"
    },

    // ── Incident escalation state ──
    incidentStatus: {
      type: String,
      enum: ["CLEARED", "SUSPECT_IMPERSONATION", "DAMAGED_ID", "UNDER_REVIEW"],
      default: "CLEARED"
    },

    // ── Evidence files ──
    idCardPhotoPath: {
      type: String,
      default: ""
    },

    liveCandidatePhotoPath: {
      type: String,
      default: null
    },

    // ── Security Staff / Admin who conducted this scan ──
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Verifier reference is required"]
    }
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true
  }
);

// ═══════════════════════════════════════════════════════════════
// INDEXES: For fast log queries and performance reporting
// ═══════════════════════════════════════════════════════════════
verificationLogSchema.index({ status: 1 });
verificationLogSchema.index({ verifiedBy: 1 });
verificationLogSchema.index({ student: 1 });
verificationLogSchema.index({ createdAt: -1 }); // Default sort order (newest log first)

const VerificationLogSchemaModel = mongoose.model("VerificationLog", verificationLogSchema);

const ProxyModel = new Proxy(VerificationLogSchemaModel, {
  get: (target, prop) => {
    const actualModel = global.useMockDB
      ? require("../utils/mockDbHelper").MockVerificationLog
      : VerificationLogSchemaModel;
    const val = actualModel[prop];
    return typeof val === "function" ? val.bind(actualModel) : val;
  }
});

module.exports = ProxyModel;
