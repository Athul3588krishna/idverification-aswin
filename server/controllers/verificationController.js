/**
 * controllers/verificationController.js
 */

const asyncHandler = require("express-async-handler");
const path = require("path");
const fs = require("fs");
const VerificationLog = require("../models/VerificationLog");
const User = require("../models/User");
const { performOCR } = require("../utils/ocrUtils");

// ═══════════════════════════════════════════════════════════════
// @desc    Process ID Card Upload and Perform OCR Matching
// @route   POST /api/verify/scan
// @access  Private — Security Staff & Admin
// ═══════════════════════════════════════════════════════════════
const verifyStudentCard = asyncHandler(async (req, res) => {
  // Ensure file is uploaded
  if (!req.file) {
    res.status(400);
    throw new Error("No ID card image file uploaded");
  }

  const imagePath = req.file.path;
  const imageRelativeUrl = `/uploads/${req.file.filename}`;

  let rawText = "";
  try {
    // ── Step 1: Perform OCR Text Extraction ──
    rawText = await performOCR(imagePath);
  } catch (err) {
    // Clean up file if OCR fails
    if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    res.status(500);
    throw new Error(`OCR processing failed: ${err.message}`);
  }

  // Normalize text for easier keyword matching
  const normalizedText = rawText.toUpperCase().replace(/[\s\-_]/g, "");

  // ── Step 2: Match OCR Text against Registered Students in Database ──
  const registeredStudents = await User.find({ role: "student" });
  let matchedStudent = null;

  for (const student of registeredStudents) {
    if (!student.studentProfile || !student.studentProfile.rollNumber) continue;
    const cleanRollNumber = student.studentProfile.rollNumber.toUpperCase().replace(/[\s\-_]/g, "");
    if (normalizedText.includes(cleanRollNumber)) {
      matchedStudent = student;
      break;
    }
  }

  let status = "REJECTED";
  let rejectionReason = "";
  let matchPercentage = 0;
  let scannedRollNumber = "";
  let scannedName = "";

  if (matchedStudent) {
    scannedRollNumber = matchedStudent.studentProfile.rollNumber;
    scannedName = matchedStudent.name;

    // Compute weighted match percentage
    let score = 40; // Roll Number matched! (40%)

    // Name Match (20%)
    const cleanName = matchedStudent.name.toUpperCase().replace(/[\s\-_]/g, "");
    if (normalizedText.includes(cleanName)) {
      score += 20;
    }

    // DOB Match (20%)
    if (matchedStudent.studentProfile.dob) {
      const cleanDob = matchedStudent.studentProfile.dob.replace(/[\s\-_\/]/g, "");
      if (normalizedText.includes(cleanDob)) {
        score += 20;
      }
    }

    // ID Number Match (20%)
    if (matchedStudent.studentProfile.idNumber) {
      const cleanId = matchedStudent.studentProfile.idNumber.toUpperCase().replace(/[\s\-_]/g, "");
      if (normalizedText.includes(cleanId)) {
        score += 20;
      }
    }

    matchPercentage = score;

    // ── Step 3: Validate Student Permit Status ──
    if (!matchedStudent.isActive) {
      status = "REJECTED";
      rejectionReason = "Candidate account is Suspended/Barred";
    } else if (matchPercentage < 60) {
      status = "REJECTED";
      rejectionReason = `Low OCR verification match score (${matchPercentage}%). Must be at least 60%.`;
    } else {
      status = "APPROVED";
    }
  } else {
    // Attempt to extract anything resembling a RollNumber using regex (e.g. MCA26001, BCA26022)
    const rollPattern = /[A-Z]{2,4}\d{4,6}/i;
    const match = rawText.match(rollPattern);
    scannedRollNumber = match ? match[0].toUpperCase() : "UNKNOWN";
    
    status = "REJECTED";
    rejectionReason = "Roll number not found in registered student database";
    matchPercentage = 0;
  }

  // ── Step 4: Write Audit Log Entry to MongoDB ──
  const logData = {
    student: matchedStudent ? matchedStudent._id : null,
    scannedRollNumber,
    scannedName: scannedName || "Unknown Name",
    rawOcrText: rawText,
    matchedDetails: matchedStudent ? {
      name: matchedStudent.name,
      rollNumber: matchedStudent.studentProfile.rollNumber,
      course: matchedStudent.studentProfile.course,
      examCenter: matchedStudent.studentProfile.examCenter
    } : {
      name: "",
      rollNumber: scannedRollNumber,
      course: "",
      examCenter: ""
    },
    matchPercentage,
    status,
    rejectionReason,
    idCardPhotoPath: imageRelativeUrl,
    verifiedBy: req.user._id // Logged in operator
  };

  const savedLog = await VerificationLog.create(logData);

  // Return verification result summary
  res.status(201).json({
    success: true,
    message: status === "APPROVED" ? "Identity Verified Successfully! Entry Approved." : `Entry Rejected: ${rejectionReason}`,
    result: {
      status,
      rejectionReason,
      matchPercentage,
      scannedRollNumber,
      scannedName: logData.scannedName,
      matchedDetails: logData.matchedDetails,
      idCardPhotoPath: imageRelativeUrl,
      logId: savedLog._id
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// @desc    Get Paginated Verification History Logs
// @route   GET /api/verify/logs
// @access  Private — Admin & Security Staff
// ═══════════════════════════════════════════════════════════════
const getVerificationLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;

  const query = {};
  if (status) query.status = status.toUpperCase();

  if (search) {
    query.$or = [
      { scannedRollNumber: { $regex: search, $options: "i" } },
      { scannedName: { $regex: search, $options: "i" } },
      { rejectionReason: { $regex: search, $options: "i" } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [logs, total] = await Promise.all([
    VerificationLog.find(query)
      .populate("verifiedBy", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    VerificationLog.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    logs
  });
});

// ═══════════════════════════════════════════════════════════════
// @desc    Get Verification Analytics/Stats for Dashboard
// @route   GET /api/verify/stats
// @access  Private — Admin & Security Staff
// ═══════════════════════════════════════════════════════════════
const getStats = asyncHandler(async (req, res) => {
  const totalStudents = await User.countDocuments({ role: "student" });
  const totalStaff = await User.countDocuments({ role: "security_staff" });
  
  // Total stats from DB logs
  const totalScans = await VerificationLog.countDocuments();
  const successScans = await VerificationLog.countDocuments({ status: "APPROVED" });
  const failedScans = await VerificationLog.countDocuments({ status: "REJECTED" });
  
  // Calculate today's stats
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todayScans = await VerificationLog.countDocuments({
    createdAt: { $gte: startOfToday }
  });
  const todayApproved = await VerificationLog.countDocuments({
    status: "APPROVED",
    createdAt: { $gte: startOfToday }
  });
  const todayRejected = await VerificationLog.countDocuments({
    status: "REJECTED",
    createdAt: { $gte: startOfToday }
  });

  res.status(200).json({
    success: true,
    stats: {
      totalStudents,
      totalStaff,
      totalScans,
      successScans,
      failedScans,
      todayScans,
      todayApproved,
      todayRejected
    }
  });
});

module.exports = {
  verifyStudentCard,
  getVerificationLogs,
  getStats
};
