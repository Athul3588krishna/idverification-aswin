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
      semester: Number(semester) || 1,
      dob,
      idNumber,
      examSubject: examSubject || "Entrance Examination 2026",
      examDate: examDate || "2026-08-15",
      examTime: examTime || "10:00 AM - 1:00 PM",
      examCenter: examCenter || "Hall A - Room 101"
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

    res.status(201).json({
      success: true,
      message: "Student candidate registered successfully",
      user: student.toPublicJSON()
    });
  })
);

// ── PUT /api/students/:id ──
// Admin updates a student record.
router.put(
  "/:id",
  protect,
  authorize("admin"),
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
    if (phone !== undefined) student.phone = phone;
    if (isActive !== undefined) student.isActive = isActive;

    // Update subprofile fields
    if (!student.studentProfile) student.studentProfile = {};
    if (course) student.studentProfile.course = course;
    if (semester) student.studentProfile.semester = Number(semester);
    if (dob) student.studentProfile.dob = dob;
    if (idNumber) student.studentProfile.idNumber = idNumber;
    if (examSubject) student.studentProfile.examSubject = examSubject;
    if (examDate) student.studentProfile.examDate = examDate;
    if (examTime) student.studentProfile.examTime = examTime;
    if (examCenter) student.studentProfile.examCenter = examCenter;

    await student.save();

    res.status(200).json({
      success: true,
      message: "Student candidate updated successfully",
      user: student.toPublicJSON()
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
