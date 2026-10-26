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
// 
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

    // Compute weighted match percentage (Roll: 40%, Name: 20%, DOB: 20%, ID/Aadhaar: 20%)
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

    matchPercentage = Math.min(100, Math.max(0, score));

    // ── Step 3: Anti-Passback Duplicate Entry Check ──
    if (matchedStudent.studentProfile && matchedStudent.studentProfile.checkInStatus === "CHECKED_IN") {
      const checkInTimeStr = matchedStudent.studentProfile.checkInTime
        ? new Date(matchedStudent.studentProfile.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "earlier today";
      
      const duplicateReason = `DUPLICATE ENTRY DETECTED! Candidate was already verified and admitted at ${checkInTimeStr}.`;

      // Log the duplicate breach attempt for security audit
      const duplicateLog = await VerificationLog.create({
        student: matchedStudent._id,
        scannedRollNumber,
        scannedName,
        rawOcrText: rawText,
        matchedDetails: {
          name: matchedStudent.name,
          rollNumber: matchedStudent.studentProfile.rollNumber,
          course: matchedStudent.studentProfile.course,
          examCenter: matchedStudent.studentProfile.examCenter
        },
        matchPercentage,
        status: "REJECTED",
        verificationType: "OCR_ID_CARD",
        isDuplicateEntry: true,
        rejectionReason: duplicateReason,
        idCardPhotoPath: imageRelativeUrl,
        allocatedHall: matchedStudent.studentProfile.allocatedHall || "Block B - Room 204",
        allocatedSeat: matchedStudent.studentProfile.allocatedSeat || "Desk #18",
        incidentStatus: "SUSPECT_IMPERSONATION",
        verifiedBy: req.user._id
      });

      try {
        const { emitEvent } = require("../utils/socket");
        emitEvent("duplicate_entry_detected", {
          log: duplicateLog,
          rollNumber: matchedStudent.studentProfile.rollNumber,
          studentName: matchedStudent.name
        });
      } catch (err) {
        console.error("Socket emit error:", err.message);
      }

      return res.status(200).json({
        success: false,
        isDuplicateEntry: true,
        message: duplicateReason,
        result: {
          status: "REJECTED",
          isDuplicateEntry: true,
          rejectionReason: duplicateReason,
          matchPercentage,
          scannedRollNumber,
          scannedName,
          matchedDetails: {
            name: matchedStudent.name,
            rollNumber: matchedStudent.studentProfile.rollNumber,
            course: matchedStudent.studentProfile.course,
            examCenter: matchedStudent.studentProfile.examCenter
          },
          allocatedHall: matchedStudent.studentProfile.allocatedHall || "Block B - Room 204",
          allocatedSeat: matchedStudent.studentProfile.allocatedSeat || "Desk #18",
          checkInTime: matchedStudent.studentProfile.checkInTime,
          idCardPhotoPath: imageRelativeUrl,
          idCardImageUrl: matchedStudent?.studentProfile?.idCardImageUrl || null,
          logId: duplicateLog._id
        }
      });
    }

    // ── Step 4: Validate Student Permit Status ──
    if (!matchedStudent.isActive) {
      status = "REJECTED";
      rejectionReason = "Candidate account is Suspended/Barred";
    } else if (matchPercentage < 60) {
      status = "REJECTED";
      rejectionReason = `Low OCR verification match score (${matchPercentage}%). Must be at least 60%.`;
    } else {
      status = "APPROVED";
      // Update candidate check-in status
      matchedStudent.studentProfile.checkInStatus = "CHECKED_IN";
      matchedStudent.studentProfile.checkInTime = new Date();
      await matchedStudent.save({ validateBeforeSave: false });
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

  // ── Step 5: Write Audit Log Entry to MongoDB ──
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
    verificationType: "OCR_ID_CARD",
    isDuplicateEntry: false,
    allocatedHall: matchedStudent?.studentProfile?.allocatedHall || "",
    allocatedSeat: matchedStudent?.studentProfile?.allocatedSeat || "",
    rejectionReason,
    idCardPhotoPath: imageRelativeUrl,
    verifiedBy: req.user._id // Logged in operator
  };

  const savedLog = await VerificationLog.create(logData);

  // Emit real-time log event via Socket.io
  try {
    const { emitEvent } = require("../utils/socket");
    emitEvent("verification_logged", {
      log: savedLog,
      rollNumber: logData.scannedRollNumber,
      studentId: logData.student
    });
    if (status === "APPROVED") {
      emitEvent("candidate_checked_in", {
        studentId: logData.student,
        rollNumber: logData.scannedRollNumber,
        name: logData.scannedName,
        hall: logData.allocatedHall,
        seat: logData.allocatedSeat
      });
    }
  } catch (err) {
    console.error("Socket emit error:", err.message);
  }

  // Return verification result summary with seating guidance
  res.status(201).json({
    success: status === "APPROVED",
    message: status === "APPROVED" 
      ? `Identity Verified Successfully! Allocated: ${logData.allocatedHall || "Hall B"} [${logData.allocatedSeat || "Desk #18"}]` 
      : `Entry Rejected: ${rejectionReason}`,
    result: {
      status,
      rejectionReason,
      matchPercentage,
      scannedRollNumber,
      scannedName: logData.scannedName,
      matchedDetails: logData.matchedDetails,
      allocatedHall: logData.allocatedHall || "Block B - Room 204",
      allocatedSeat: logData.allocatedSeat || "Desk #18",
      checkInTime: matchedStudent?.studentProfile?.checkInTime || null,
      idCardPhotoPath: imageRelativeUrl,
      idCardImageUrl: matchedStudent?.studentProfile?.idCardImageUrl || null,
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
  const pendingStudents = await User.countDocuments({ role: "student", isActive: false });
  const totalStaff = await User.countDocuments({ role: "security_staff" });
  
  // Real-world gate attendance stats
  const checkedInStudents = await User.countDocuments({ 
    role: "student", 
    "studentProfile.checkInStatus": "CHECKED_IN" 
  });
  const notArrivedStudents = Math.max(0, totalStudents - checkedInStudents);
  const duplicateBreaches = await VerificationLog.countDocuments({ isDuplicateEntry: true });

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
      pendingStudents,
      totalStaff,
      checkedInStudents,
      notArrivedStudents,
      duplicateBreaches,
      totalScans,
      successScans,
      failedScans,
      todayScans,
      todayApproved,
      todayRejected
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// @desc    Perform Manual Roll Number Matching (No OCR Fallback)
// @route   POST /api/verify/manual
// @access  Private — Security Staff & Admin
// ═══════════════════════════════════════════════════════════════
const verifyStudentCardManual = asyncHandler(async (req, res) => {
  const { rollNumber } = req.body;

  if (!rollNumber) {
    res.status(400);
    throw new Error("Please provide a roll number");
  }

  // Find student by roll number
  const student = await User.findOne({
    role: "student",
    "studentProfile.rollNumber": rollNumber.trim().toUpperCase()
  });

  let status = "REJECTED";
  let rejectionReason = "";
  let isDuplicate = false;

  if (student) {
    // Anti-Passback Check
    if (student.studentProfile?.checkInStatus === "CHECKED_IN") {
      isDuplicate = true;
      const checkInTimeStr = student.studentProfile.checkInTime
        ? new Date(student.studentProfile.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : "earlier today";
      rejectionReason = `DUPLICATE ENTRY DETECTED! Candidate already checked in at ${checkInTimeStr}`;
    } else if (!student.isActive) {
      status = "REJECTED";
      rejectionReason = "Candidate account is Pending/Suspended";
    } else {
      status = "APPROVED";
      student.studentProfile.checkInStatus = "CHECKED_IN";
      student.studentProfile.checkInTime = new Date();
      await student.save({ validateBeforeSave: false });
    }
  } else {
    status = "REJECTED";
    rejectionReason = "Roll number not found in registered student database";
  }

  // Write audit log entry to MongoDB
  const logData = {
    student: student ? student._id : null,
    scannedRollNumber: rollNumber.trim().toUpperCase(),
    scannedName: student ? student.name : "Unknown Name",
    rawOcrText: "MANUAL OVERRIDE CHECK",
    matchedDetails: student ? {
      name: student.name,
      rollNumber: student.studentProfile.rollNumber,
      course: student.studentProfile.course,
      examCenter: student.studentProfile.examCenter
    } : {
      name: "",
      rollNumber: rollNumber.trim().toUpperCase(),
      course: "",
      examCenter: ""
    },
    matchPercentage: 100,
    status,
    verificationType: "MANUAL_OVERRIDE",
    isDuplicateEntry: isDuplicate,
    allocatedHall: student?.studentProfile?.allocatedHall || "",
    allocatedSeat: student?.studentProfile?.allocatedSeat || "",
    rejectionReason,
    idCardPhotoPath: null,
    verifiedBy: req.user._id
  };

  const savedLog = await VerificationLog.create(logData);

  // Emit real-time log event via Socket.io
  try {
    const { emitEvent } = require("../utils/socket");
    emitEvent("verification_logged", {
      log: savedLog,
      rollNumber: logData.scannedRollNumber,
      studentId: logData.student
    });
    if (status === "APPROVED") {
      emitEvent("candidate_checked_in", {
        studentId: logData.student,
        rollNumber: logData.scannedRollNumber,
        name: logData.scannedName,
        hall: logData.allocatedHall,
        seat: logData.allocatedSeat
      });
    } else if (isDuplicate) {
      emitEvent("duplicate_entry_detected", {
        log: savedLog,
        rollNumber: logData.scannedRollNumber,
        studentName: logData.scannedName
      });
    }
  } catch (err) {
    console.error("Socket emit error:", err.message);
  }

  res.status(status === "APPROVED" ? 200 : 200).json({
    success: status === "APPROVED",
    isDuplicateEntry: isDuplicate,
    message: status === "APPROVED" 
      ? `Manual Verification Success! Entry Approved. Proceed to ${logData.allocatedHall || "Exam Hall"} [${logData.allocatedSeat || "Desk #18"}]` 
      : `Entry Denied: ${rejectionReason}`,
    result: {
      status,
      isDuplicateEntry: isDuplicate,
      rejectionReason,
      matchPercentage: 100,
      scannedRollNumber: rollNumber.trim().toUpperCase(),
      scannedName: logData.scannedName,
      matchedDetails: logData.matchedDetails,
      allocatedHall: logData.allocatedHall || "Block B - Room 204",
      allocatedSeat: logData.allocatedSeat || "Desk #18",
      checkInTime: student?.studentProfile?.checkInTime || null,
      idCardPhotoPath: null,
      idCardImageUrl: student?.studentProfile?.idCardImageUrl || null,
      logId: savedLog._id
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// @desc    Fast Hall Ticket QR Code Scan & Verification (<100ms)
// @route   POST /api/verify/qr-scan
// @access  Private — Security Staff & Admin
// ═══════════════════════════════════════════════════════════════
const verifyHallTicketQR = asyncHandler(async (req, res) => {
  const { qrData, livePhoto } = req.body;

  if (!qrData) {
    res.status(400);
    throw new Error("Admit Card QR data is required");
  }

  let rollNumber = qrData.trim().toUpperCase();
  let qrToken = qrData.trim();

  try {
    const parsed = JSON.parse(qrData);
    if (parsed.rollNumber) rollNumber = parsed.rollNumber.trim().toUpperCase();
    if (parsed.qrToken) qrToken = parsed.qrToken;
  } catch (e) {
    // qrData is plain text e.g. "EXAM-MCA26001-2026" or "MCA26001"
  }

  // Find student by qrToken or rollNumber or cleaned rollNumber
  const cleanedRoll = rollNumber.replace(/^EXAM-|-2026$/g, "").trim().toUpperCase();
  const student = await User.findOne({
    role: "student",
    $or: [
      { "studentProfile.qrToken": qrToken },
      { "studentProfile.rollNumber": rollNumber },
      { "studentProfile.rollNumber": cleanedRoll }
    ]
  });

  if (!student) {
    return res.status(200).json({
      success: false,
      message: "Admit Card QR is invalid or not registered in examination system",
      result: {
        status: "REJECTED",
        rejectionReason: "Admit Card QR is invalid or not registered in database",
        scannedRollNumber: rollNumber
      }
    });
  }

  // Anti-Passback Check
  if (student.studentProfile?.checkInStatus === "CHECKED_IN") {
    const checkInTimeStr = student.studentProfile.checkInTime
      ? new Date(student.studentProfile.checkInTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : "earlier today";
    
    const rejectionReason = `DUPLICATE ENTRY DETECTED! Candidate was already admitted at ${checkInTimeStr}.`;

    const duplicateLog = await VerificationLog.create({
      student: student._id,
      scannedRollNumber: student.studentProfile.rollNumber,
      scannedName: student.name,
      rawOcrText: `QR SCAN: ${qrData}`,
      matchedDetails: {
        name: student.name,
        rollNumber: student.studentProfile.rollNumber,
        course: student.studentProfile.course,
        examCenter: student.studentProfile.examCenter
      },
      matchPercentage: 100,
      status: "REJECTED",
      verificationType: "QR_HALL_TICKET",
      isDuplicateEntry: true,
      rejectionReason,
      allocatedHall: student.studentProfile.allocatedHall || "Block B - Room 204",
      allocatedSeat: student.studentProfile.allocatedSeat || "Desk #18",
      incidentStatus: "SUSPECT_IMPERSONATION",
      liveCandidatePhotoPath: livePhoto || null,
      verifiedBy: req.user._id
    });

    try {
      const { emitEvent } = require("../utils/socket");
      emitEvent("duplicate_entry_detected", {
        log: duplicateLog,
        rollNumber: student.studentProfile.rollNumber,
        studentName: student.name
      });
    } catch (err) {}

    return res.status(200).json({
      success: false,
      isDuplicateEntry: true,
      message: rejectionReason,
      result: {
        status: "REJECTED",
        isDuplicateEntry: true,
        rejectionReason,
        matchPercentage: 100,
        scannedRollNumber: student.studentProfile.rollNumber,
        scannedName: student.name,
        matchedDetails: {
          name: student.name,
          rollNumber: student.studentProfile.rollNumber,
          course: student.studentProfile.course,
          examCenter: student.studentProfile.examCenter
        },
        allocatedHall: student.studentProfile.allocatedHall || "Block B - Room 204",
        allocatedSeat: student.studentProfile.allocatedSeat || "Desk #18",
        checkInTime: student.studentProfile.checkInTime,
        idCardImageUrl: student.studentProfile?.idCardImageUrl || null,
        logId: duplicateLog._id
      }
    });
  }

  if (!student.isActive) {
    return res.status(200).json({
      success: false,
      message: "Candidate examination hall ticket is suspended/barred",
      result: {
        status: "REJECTED",
        rejectionReason: "Candidate hall ticket is suspended/barred",
        scannedRollNumber: student.studentProfile.rollNumber,
        scannedName: student.name
      }
    });
  }

  // Authorize entry!
  student.studentProfile.checkInStatus = "CHECKED_IN";
  student.studentProfile.checkInTime = new Date();
  await student.save({ validateBeforeSave: false });

  const savedLog = await VerificationLog.create({
    student: student._id,
    scannedRollNumber: student.studentProfile.rollNumber,
    scannedName: student.name,
    rawOcrText: `QR HALL TICKET: ${qrData}`,
    matchedDetails: {
      name: student.name,
      rollNumber: student.studentProfile.rollNumber,
      course: student.studentProfile.course,
      examCenter: student.studentProfile.examCenter
    },
    matchPercentage: 100,
    status: "APPROVED",
    verificationType: "QR_HALL_TICKET",
    allocatedHall: student.studentProfile.allocatedHall || "Block B - Room 204",
    allocatedSeat: student.studentProfile.allocatedSeat || "Desk #18",
    rejectionReason: "",
    liveCandidatePhotoPath: livePhoto || null,
    verifiedBy: req.user._id
  });

  try {
    const { emitEvent } = require("../utils/socket");
    emitEvent("verification_logged", {
      log: savedLog,
      rollNumber: student.studentProfile.rollNumber,
      studentId: student._id
    });
    emitEvent("candidate_checked_in", {
      studentId: student._id,
      rollNumber: student.studentProfile.rollNumber,
      name: student.name,
      hall: student.studentProfile.allocatedHall,
      seat: student.studentProfile.allocatedSeat
    });
  } catch (err) {}

  res.status(200).json({
    success: true,
    message: `Admit Card QR Verified! Admitted to: ${student.studentProfile.allocatedHall || "Room 204"} [${student.studentProfile.allocatedSeat || "Desk #18"}]`,
    result: {
      status: "APPROVED",
      rejectionReason: "",
      matchPercentage: 100,
      scannedRollNumber: student.studentProfile.rollNumber,
      scannedName: student.name,
      matchedDetails: {
        name: student.name,
        rollNumber: student.studentProfile.rollNumber,
        course: student.studentProfile.course,
        examCenter: student.studentProfile.examCenter
      },
      allocatedHall: student.studentProfile.allocatedHall || "Block B - Room 204",
      allocatedSeat: student.studentProfile.allocatedSeat || "Desk #18",
      checkInTime: student.studentProfile.checkInTime,
      idCardImageUrl: student.studentProfile?.idCardImageUrl || null,
      logId: savedLog._id
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// @desc    Reset All Candidate Check-In Statuses (For Live Testing & Next Shift)
// @route   POST /api/verify/reset-session
// @access  Private — Admin only
// ═══════════════════════════════════════════════════════════════
const resetCheckInSession = asyncHandler(async (req, res) => {
  const students = await User.find({ role: "student" });
  let count = 0;
  for (const s of students) {
    if (s.studentProfile) {
      s.studentProfile.checkInStatus = "NOT_ARRIVED";
      s.studentProfile.checkInTime = null;
      await s.save({ validateBeforeSave: false });
      count++;
    }
  }

  try {
    const { emitEvent } = require("../utils/socket");
    emitEvent("session_reset", { count, timestamp: new Date() });
  } catch (err) {}

  res.status(200).json({
    success: true,
    message: `🎉 Successfully reset exam gate check-in status for all ${count} student candidates!`,
    count
  });
});

module.exports = {
  verifyStudentCard,
  verifyStudentCardManual,
  verifyHallTicketQR,
  resetCheckInSession,
  getVerificationLogs,
  getStats
};
