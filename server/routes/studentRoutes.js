/**
 * routes/studentRoutes.js
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   Exposes full CRUD student candidate management endpoints for administrators.
 *   Interacts directly with the database (MongoDB / Mock DB fallback).
 * ═══════════════════════════════════════════════════════════════
 */

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect, authorize } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const asyncHandler = require("express-async-handler");

// ── GET /api/students ──
// Returns the list of registered exam candidates from the database.
router.get(
  "/",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const search = req.query.search ? req.query.search.toLowerCase() : "";
    
    // Build query filter
    const query = { role: "student" };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { "studentProfile.rollNumber": { $regex: search, $options: "i" } }
      ];
    }

    const students = await User.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: students.length,
      pages: 1,
      page: 1,
      users: students
    });
  })
);

// ── POST /api/students ──
// Admin creates a student record directly.
router.post(
  "/",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
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
      examCenter
    } = req.body;

    if (!name || !email || !password || !rollNumber || !course || !dob || !idNumber) {
      res.status(400);
      throw new Error("Name, email, password, roll number, course, DOB, and ID number are required");
    }

    const cleanIdNumber = idNumber ? idNumber.trim().replace(/\D/g, "") : "";
    if (cleanIdNumber.length !== 12) {
      res.status(400);
      throw new Error("Aadhaar number must be exactly 12 numeric digits");
    }

    if (phone && phone.trim()) {
      const cleanPhone = phone.trim().replace(/\D/g, "");
      if (cleanPhone.length !== 10) {
        res.status(400);
        throw new Error("Phone number must be exactly 10 numeric digits");
      }
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409);
      throw new Error("An account with this email already exists");
    }

    const existingRoll = await User.findOne({
      "studentProfile.rollNumber": rollNumber.toUpperCase()
    });
    if (existingRoll) {
      res.status(409);
      throw new Error(`Roll number '${rollNumber}' is already registered`);
    }

    const studentProfile = {
      rollNumber: rollNumber.toUpperCase(),
      course,
      semester: Math.min(Math.max(Number(semester) || 1, 1), 20),
      dob,
      idNumber,
      examSubject: examSubject || "Entrance Examination 2026",
      examDate: examDate || "2026-08-15",
      examTime: examTime || "10:00 AM - 1:00 PM",
      examCenter: examCenter || "Hall A - Room 101",
      allocatedHall: req.body.allocatedHall || "Block B - Room 204",
      allocatedSeat: req.body.allocatedSeat || `Desk #${Math.floor(Math.random() * 30) + 1}`,
      checkInStatus: "NOT_ARRIVED",
      checkInTime: null,
      qrToken: `EXAM-${rollNumber.toUpperCase()}-2026`
    };

    const student = await User.create({
      name,
      email,
      password,
      phone: phone || null,
      role: "student",
      studentProfile,
      createdBy: req.user._id,
      isActive: true
    });

    try {
      const { emitEvent } = require("../utils/socket");
      emitEvent("student_status_updated", { newStudent: true, userId: student._id, isActive: true });
    } catch (err) {
      console.error("Socket emit error:", err.message);
    }

    res.status(201).json({
      success: true,
      message: "Student candidate registered successfully",
      user: student.toPublicJSON()
    });
  })
);

// ── PUT /api/students/approve-all ──
// Single-click bulk approval for all pending students.
router.put(
  "/approve-all",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const students = await User.find({ role: "student", isActive: false });
    let count = 0;
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

    for (const s of students) {
      s.isActive = true;
      if (!s.studentProfile) s.studentProfile = {};
      s.studentProfile.adminVerified = true;
      s.studentProfile.adminVerifiedAt = new Date();

      if (!s.studentProfile.examDate || s.studentProfile.examDate.includes("Pending")) {
        s.studentProfile.examDate = "2026-08-10";
      }
      if (!s.studentProfile.examTime || s.studentProfile.examTime.includes("Pending")) {
        s.studentProfile.examTime = "10:00 AM - 1:00 PM";
      }
      if (!s.studentProfile.allocatedHall || s.studentProfile.allocatedHall.includes("Pending")) {
        s.studentProfile.allocatedHall = halls[count % halls.length];
      }
      if (!s.studentProfile.allocatedSeat || s.studentProfile.allocatedSeat.includes("Pending")) {
        s.studentProfile.allocatedSeat = `Desk #${(count % 30) + 1}`;
      }
      if (!s.studentProfile.examCenter || s.studentProfile.examCenter.includes("Pending")) {
        s.studentProfile.examCenter = "State University Main Examination Complex";
      }

      await s.save({ validateBeforeSave: false });

      // Send Telegram notification with Exam Date, Room, and Time
      try {
        const { sendTelegramApprovalNotification } = require("../utils/telegram");
        sendTelegramApprovalNotification({
          chatId: s.studentProfile?.telegramChatId,
          studentName: s.name,
          rollNumber: s.studentProfile?.rollNumber || "N/A",
          course: s.studentProfile?.course,
          examSubject: s.studentProfile?.examSubject || "Entrance Examination 2026",
          examDate: s.studentProfile?.examDate,
          examTime: s.studentProfile?.examTime,
          allocatedHall: s.studentProfile?.allocatedHall,
          allocatedSeat: s.studentProfile?.allocatedSeat,
          examCenter: s.studentProfile?.examCenter
        }).catch((err) => console.warn(`[Telegram Error for ${s.name}]:`, err.message));
      } catch (err) {}

      // Send approval notification email
      try {
        const { sendApprovalEmail } = require("../utils/mailer");
        sendApprovalEmail(
          s.email,
          s.name,
          s.studentProfile?.rollNumber || "N/A",
          s.studentProfile?.allocatedHall,
          s.studentProfile?.allocatedSeat,
          s.studentProfile?.examSubject
        ).catch(() => {});
      } catch (err) {}

      count++;
    }

    try {
      const { emitEvent } = require("../utils/socket");
      emitEvent("student_status_updated", { allApproved: true, isActive: true });
    } catch (err) {
      console.error("Socket emit error:", err.message);
    }

    res.status(200).json({
      success: true,
      message: `🎉 Successfully approved all ${count} pending student registrations!`,
      count
    });
  })
);

// ── GET & PUT /api/students/auto-approve ──
// Auto-approval automation mode settings.
router.get(
  "/auto-approve",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { getAutoApprove } = require("../utils/systemConfig");
    res.status(200).json({
      success: true,
      autoApprove: getAutoApprove()
    });
  })
);

router.put(
  "/auto-approve",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { autoApprove } = req.body;
    const { setAutoApprove } = require("../utils/systemConfig");
    const updated = setAutoApprove(autoApprove);

    let approvedCount = 0;
    if (updated) {
      const pendingStudents = await User.find({ role: "student", isActive: false });
      for (const s of pendingStudents) {
        s.isActive = true;
        await s.save({ validateBeforeSave: false });
        approvedCount++;
      }
    }

    try {
      const { emitEvent } = require("../utils/socket");
      emitEvent("student_status_updated", { allApproved: updated, autoApprove: updated, count: approvedCount });
    } catch (err) {
      console.error("Socket emit error:", err.message);
    }

    res.status(200).json({
      success: true,
      message: updated
        ? `Auto-approval turned ON. Approved ${approvedCount} existing pending student(s).`
        : "Auto-approval automation has been turned OFF.",
      autoApprove: updated,
      count: approvedCount
    });
  })
);

// ── PUT /api/students/:id ──
// Admin updates a student record.
router.put(
  "/:id",
  protect,
  authorize("admin"),
  upload.single("photo"),
  asyncHandler(async (req, res) => {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== "student") {
      res.status(404);
      throw new Error("Student candidate not found");
    }

    const {
      name,
      email,
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
      idCardImageUrl,
      isActive
    } = req.body;

    if (email && email.toLowerCase() !== student.email.toLowerCase()) {
      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        res.status(409);
        throw new Error("Email already in use by another user");
      }
      student.email = email;
    }

    if (rollNumber && rollNumber.toUpperCase() !== student.studentProfile.rollNumber) {
      const existingRoll = await User.findOne({
        "studentProfile.rollNumber": rollNumber.toUpperCase()
      });
      if (existingRoll) {
        res.status(409);
        throw new Error("Roll number already registered to another student");
      }
      student.studentProfile.rollNumber = rollNumber.toUpperCase();
    }

    if (name) student.name = name;
    if (phone !== undefined) {
      if (phone && phone.trim()) {
        const cleanPhone = phone.trim().replace(/\D/g, "");
        if (cleanPhone.length !== 10) {
          res.status(400);
          throw new Error("Phone number must be exactly 10 numeric digits");
        }
        student.phone = cleanPhone;
      } else {
        student.phone = null;
      }
    }
    const wasInactive = !student.isActive;
    if (isActive !== undefined) student.isActive = isActive;

    // Update subprofile fields
    if (!student.studentProfile) student.studentProfile = {};
    if (req.body.telegramChatId !== undefined) {
      student.studentProfile.telegramChatId = req.body.telegramChatId.trim();
    }
    if (course) student.studentProfile.course = course;
    if (semester) student.studentProfile.semester = Math.min(Math.max(Number(semester) || 1, 1), 20);
    if (dob) student.studentProfile.dob = dob;
    if (idNumber) {
      const cleanIdNumber = idNumber.trim().replace(/\D/g, "");
      if (cleanIdNumber.length !== 12) {
        res.status(400);
        throw new Error("Aadhaar number must be exactly 12 numeric digits");
      }
      student.studentProfile.idNumber = cleanIdNumber;
    }
    if (examSubject) student.studentProfile.examSubject = examSubject;
    if (examDate) student.studentProfile.examDate = examDate;
    if (examTime) student.studentProfile.examTime = examTime;
    if (examCenter) student.studentProfile.examCenter = examCenter;
    if (req.file) {
      student.studentProfile.photoUrl = `/uploads/${req.file.filename}`;
      student.studentProfile.idCardImageUrl = `/uploads/${req.file.filename}`;
    } else if (idCardImageUrl !== undefined) {
      student.studentProfile.idCardImageUrl = idCardImageUrl;
    }

    // If activating candidate, ensure date/time/hall/seat are present and notify via Telegram
    if (student.isActive && wasInactive) {
      student.studentProfile.adminVerified = true;
      student.studentProfile.adminVerifiedAt = new Date();

      if (!student.studentProfile.examDate || student.studentProfile.examDate.includes("Pending")) {
        student.studentProfile.examDate = "2026-08-10";
      }
      if (!student.studentProfile.examTime || student.studentProfile.examTime.includes("Pending")) {
        student.studentProfile.examTime = "10:00 AM - 1:00 PM";
      }
      if (!student.studentProfile.allocatedHall || student.studentProfile.allocatedHall.includes("Pending")) {
        student.studentProfile.allocatedHall = "Block B - Room 204";
      }
      if (!student.studentProfile.allocatedSeat || student.studentProfile.allocatedSeat.includes("Pending")) {
        student.studentProfile.allocatedSeat = `Desk #${Math.floor(Math.random() * 30) + 1}`;
      }
      if (!student.studentProfile.examCenter || student.studentProfile.examCenter.includes("Pending")) {
        student.studentProfile.examCenter = "State University Main Examination Complex";
      }

      try {
        const { sendTelegramApprovalNotification } = require("../utils/telegram");
        sendTelegramApprovalNotification({
          chatId: student.studentProfile?.telegramChatId,
          studentName: student.name,
          rollNumber: student.studentProfile?.rollNumber || "N/A",
          course: student.studentProfile?.course,
          examSubject: student.studentProfile?.examSubject || "Entrance Examination 2026",
          examDate: student.studentProfile?.examDate,
          examTime: student.studentProfile?.examTime,
          allocatedHall: student.studentProfile?.allocatedHall,
          allocatedSeat: student.studentProfile?.allocatedSeat,
          examCenter: student.studentProfile?.examCenter
        }).catch((err) => console.warn("[Telegram Error]:", err.message));
      } catch (err) {}
    }

    await student.save();

    res.status(200).json({
      success: true,
      message: "Student candidate updated successfully",
      user: student.toPublicJSON()
    });
  })
);

// ── POST /api/students/:id/notify-telegram ──
// Manually triggers or resends Telegram exam notification for a candidate.
router.post(
  "/:id/notify-telegram",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== "student") {
      res.status(404);
      throw new Error("Student candidate not found");
    }

    const { sendTelegramApprovalNotification } = require("../utils/telegram");
    const result = await sendTelegramApprovalNotification({
      chatId: req.body.chatId || student.studentProfile?.telegramChatId,
      studentName: student.name,
      rollNumber: student.studentProfile?.rollNumber || "N/A",
      course: student.studentProfile?.course,
      examSubject: student.studentProfile?.examSubject || "Entrance Examination 2026",
      examDate: student.studentProfile?.examDate || "2026-08-10",
      examTime: student.studentProfile?.examTime || "10:00 AM - 1:00 PM",
      allocatedHall: student.studentProfile?.allocatedHall || "Block B - Room 204",
      allocatedSeat: student.studentProfile?.allocatedSeat || "Desk #18",
      examCenter: student.studentProfile?.examCenter || "State University Main Examination Complex"
    });

    res.status(200).json({
      success: true,
      result,
      message: result.delivered
        ? `Telegram notification sent successfully to ${student.name}!`
        : `Notification logged (${result.message || "Simulated / Logged in server console"})`
    });
  })
);

// ── POST /api/students/test-telegram ──
// Allows testing Telegram Bot connectivity directly.
router.post(
  "/test-telegram",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const { chatId } = req.body;
    const { sendTelegramMessage } = require("../utils/telegram");

    const result = await sendTelegramMessage(
      chatId,
      `🔔 <b>ExamShield System Test Notification</b>\n\nTelegram Bot connection is working perfectly! System is ready to notify candidates upon registration approval.`
    );

    res.status(200).json({
      success: result.success,
      result,
      message: result.delivered
        ? "Telegram test message delivered successfully!"
        : (result.message || "Test completed")
    });
  })
);

// ── DELETE /api/students/:id ──
// Admin deletes a student record.
router.delete(
  "/:id",
  protect,
  authorize("admin"),
  asyncHandler(async (req, res) => {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== "student") {
      res.status(404);
      throw new Error("Student candidate not found");
    }

    await student.deleteOne();

    res.status(200).json({
      success: true,
      message: "Student candidate profile deleted successfully"
    });
  })
);

module.exports = router;
