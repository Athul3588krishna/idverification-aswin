/**
 * pages/AddStudent.jsx
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   Admin-only candidate registration form.
 *   Provides the frontend form to create user credentials and
 *   student profile details (DOB, ID Number, Exam Details) in a single submission.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FiUserPlus, FiArrowLeft, FiInfo, FiKey } from "react-icons/fi";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";
import { registerUserAPI } from "../api/authAPI";

const AddStudent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "student",
    rollNumber: "",
    course: "MCA",
    semester: 1,
    department: "Computer Applications",
    examCenter: "Hall A - Room 102",
    admissionYear: new Date().getFullYear(),
    dob: "",
    idNumber: "",
    examSubject: "Entrance Examination 2026",
    examDate: "2026-08-10",
    examTime: "10:00 AM - 1:00 PM"
  });

  // Load configured default exam settings from localStorage on mount
  useEffect(() => {
    const config = localStorage.getItem("examshield_exam_config");
    if (config) {
      const parsed = JSON.parse(config);
      setFormData((prev) => ({
        ...prev,
        examSubject: parsed.subject || prev.examSubject,
        examDate: parsed.date || prev.examDate,
        examTime: parsed.time || prev.examTime,
        examCenter: parsed.center || prev.examCenter,
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let generated = "";
    for (let i = 0; i < 10; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData((prev) => ({ ...prev, password: generated }));
    toast.info(`Generated random password: ${generated}`, { autoClose: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, email, password, rollNumber, course, dob, idNumber } = formData;

    // Validation
    if (!name.trim() || !email.trim() || !password.trim() || !rollNumber.trim() || !course.trim() || !dob || !idNumber.trim()) {
      toast.error("Please fill in all mandatory fields (marked with *)");
      return;
    }

    setLoading(true);
    try {
      await registerUserAPI({
        ...formData,
        email: email.trim().toLowerCase(),
        rollNumber: rollNumber.trim().toUpperCase(),
        idNumber: idNumber.trim()
      });
      toast.success("Student registered successfully! 🎉");
      navigate("/students");
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed. Check roll number/email constraints.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gradient-bg min-vh-100 d-flex flex-column">
      <Navbar />
      <div className="page-layout">
        <Sidebar />
        <main className="main-content container-fluid animate-fade-in-up">
          {/* Header */}
          <div className="d-flex align-items-center gap-3 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="btn btn-outline-secondary p-2 d-flex align-items-center justify-content-center rounded-circle"
              style={{ width: "40px", height: "40px", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
              title="Go Back"
              disabled={loading}
            >
              <FiArrowLeft size={18} />
            </button>
            <div>
              <h2 className="mb-0" style={{ fontWeight: 700, fontFamily: "Space Grotesk, sans-serif" }}>
                Register Student
              </h2>
              <p className="text-secondary mb-0">Create candidate account and register academic/verification details</p>
            </div>
          </div>

          {/* Form Card */}
          <div className="glass-card mb-5">
            <form onSubmit={handleSubmit} className="row g-4">
              
              {/* Account Credentials Header */}
              <div className="col-12 border-bottom pb-2 mb-2" style={{ borderColor: "var(--border-color) !important" }}>
                <h5 className="text-primary-light d-flex align-items-center gap-2 mb-0" style={{ color: "var(--primary-light)" }}>
                  <FiKey size={18} /> 1. Account Credentials
                </h5>
              </div>

              {/* Candidate Full Name */}
              <div className="col-12 col-md-6">
                <label className="form-label-custom">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  className="form-control-custom w-100"
                  placeholder="e.g., Aswin Kumar"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              {/* Email Address */}
              <div className="col-12 col-md-6">
                <label className="form-label-custom">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  className="form-control-custom w-100"
                  placeholder="aswin@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              {/* Password */}
              <div className="col-12 col-md-6">
                <label className="form-label-custom">Password *</label>
                <div className="d-flex gap-2">
                  <input
                    type="text"
                    name="password"
                    className="form-control-custom flex-grow-1"
                    placeholder="Enter password or generate"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="btn btn-outline-secondary text-nowrap"
                    style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}
                    disabled={loading}
                  >
                    Auto-Gen
                  </button>
                </div>
              </div>

              {/* Contact Phone */}
              <div className="col-12 col-md-6">
                <label className="form-label-custom">Phone Number (10 digits)</label>
                <input
                  type="text"
                  name="phone"
                  className="form-control-custom w-100"
                  placeholder="9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              {/* Academic Profile Header */}
              <div className="col-12 border-bottom pb-2 mb-2 mt-4" style={{ borderColor: "var(--border-color) !important" }}>
                <h5 className="text-primary-light d-flex align-items-center gap-2 mb-0" style={{ color: "var(--primary-light)" }}>
                  <FiInfo size={18} /> 2. Student Verification Profile
                </h5>
              </div>

              {/* Roll Number */}
              <div className="col-12 col-md-6 col-lg-4">
                <label className="form-label-custom">Roll Number (Unique ID) *</label>
                <input
                  type="text"
                  name="rollNumber"
                  className="form-control-custom w-100 text-uppercase"
                  placeholder="e.g., MCA26004"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              {/* Program Course */}
              <div className="col-12 col-md-6 col-lg-4">
                <label className="form-label-custom">Course / Program *</label>
                <input
                  type="text"
                  name="course"
                  className="form-control-custom w-100"
                  placeholder="e.g., MCA"
                  value={formData.course}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              {/* Semester */}
              <div className="col-12 col-md-6 col-lg-4">
                <label className="form-label-custom">Semester</label>
                <select
                  name="semester"
                  className="form-control-custom w-100"
                  value={formData.semester}
                  onChange={handleChange}
                  disabled={loading}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <option key={num} value={num}>Semester {num}</option>
                  ))}
                </select>
              </div>

              {/* Date of Birth */}
              <div className="col-12 col-md-6">
                <label className="form-label-custom">Date of Birth *</label>
                <input
                  type="date"
                  name="dob"
                  className="form-control-custom w-100 text-white"
                  value={formData.dob}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              {/* Government ID Number */}
              <div className="col-12 col-md-6">
                <label className="form-label-custom">Government ID Number *</label>
                <input
                  type="text"
                  name="idNumber"
                  className="form-control-custom w-100"
                  placeholder="Aadhaar or Govt ID Card No"
                  value={formData.idNumber}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              {/* Department */}
              <div className="col-12 col-md-6">
                <label className="form-label-custom">Department</label>
                <input
                  type="text"
                  name="department"
                  className="form-control-custom w-100"
                  placeholder="Computer Applications"
                  value={formData.department}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              {/* Admission Year */}
              <div className="col-12 col-md-6">
                <label className="form-label-custom">Admission Year</label>
                <input
                  type="number"
                  name="admissionYear"
                  className="form-control-custom w-100"
                  value={formData.admissionYear}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              {/* Examination Center Assigned */}
              <div className="col-12 col-md-6">
                <label className="form-label-custom">Assigned Examination Center Venue</label>
                <input
                  type="text"
                  name="examCenter"
                  className="form-control-custom w-100"
                  placeholder="e.g., Lab 2, First Floor, Main Building"
                  value={formData.examCenter}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              {/* Exam Subject */}
              <div className="col-12 col-md-6">
                <label className="form-label-custom">Exam Subject</label>
                <input
                  type="text"
                  name="examSubject"
                  className="form-control-custom w-100"
                  value={formData.examSubject}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              {/* Exam Date */}
              <div className="col-12 col-md-6">
                <label className="form-label-custom">Exam Date</label>
                <input
                  type="text"
                  name="examDate"
                  className="form-control-custom w-100"
                  value={formData.examDate}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              {/* Exam Time */}
              <div className="col-12 col-md-6">
                <label className="form-label-custom">Exam Time</label>
                <input
                  type="text"
                  name="examTime"
                  className="form-control-custom w-100"
                  value={formData.examTime}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              {/* Submit Buttons */}
              <div className="col-12 d-flex justify-content-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => navigate("/students")}
                  className="btn btn-outline-secondary"
                  style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary-custom d-flex align-items-center gap-2"
                  disabled={loading}
                >
                  <FiUserPlus size={16} />
                  {loading ? "Registering..." : "Complete Registration"}
                </button>
              </div>

            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AddStudent;
