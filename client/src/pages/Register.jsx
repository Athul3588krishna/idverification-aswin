/**
 * pages/Register.jsx
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   The public registration page for student self-registration.
 *   Uses a beautiful glassmorphism style card similar to Login.jsx.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FiUser, FiMail, FiLock, FiPhone, FiBook, FiCalendar, FiCreditCard, FiShield, FiArrowLeft } from "react-icons/fi";

import useAuth from "../hooks/useAuth";
import { studentRegisterAPI, sendOTPAPI } from "../api/authAPI";

const Register = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
    phone: "",
    rollNumber: "",
    course: "MCA",
    semester: 1,
    dob: "",
    idNumber: "",
    examCenter: "Hall A - Room 102",
    examSubject: "Entrance Examination 2026",
    examDate: "2026-08-10",
    examTime: "10:00 AM - 1:00 PM"
  });

  const [isLoading, setIsLoading] = useState(false);

  // OTP State
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [otp, setOtp] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSendOTP = async () => {
    if (!formData.email.trim()) {
      toast.warn("Please enter a valid email address first");
      return;
    }

    // Email regex validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(formData.email.trim())) {
      toast.warn("Please enter a valid email address format");
      return;
    }

    setSendingOTP(true);
    try {
      const data = await sendOTPAPI({ email: formData.email.trim() });
      if (data.success) {
        setOtpSent(true);
        toast.success("Verification OTP code sent successfully! Check your email.");
      }
    } catch (err) {
      const message = err.response?.data?.message || "Failed to send verification OTP.";
      toast.error(message);
    } finally {
      setSendingOTP(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { name, email, password, rollNumber, course, dob, idNumber } = formData;

    if (!name.trim() || !email.trim() || !password.trim() || !rollNumber.trim() || !course || !dob || !idNumber.trim() || !otp.trim()) {
      toast.warn("Please fill in all required fields (marked with *), including the Email OTP");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name,
        email: email.trim().toLowerCase(),
        password,
        role: "student",
        phone: formData.phone || undefined,
        rollNumber: rollNumber.trim().toUpperCase(),
        course,
        semester: formData.semester,
        dob,
        idNumber: idNumber.trim(),
        examCenter: formData.examCenter,
        examSubject: formData.examSubject,
        examDate: formData.examDate,
        examTime: formData.examTime,
        otp: otp.trim(),
      };

      await studentRegisterAPI(payload);

      toast.success("Registration successful! Log in to view your approval status. 🎉", { autoClose: 6000 });
      navigate("/student/login");
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed. Please try again.";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page gradient-bg py-5">
      <div className="login-container animate-fade-in-up" style={{ maxWidth: "600px" }}>
        {/* Brand Header */}
        <div className="login-brand mb-4">
          <div className="brand-icon">
            <FiShield size={36} />
          </div>
          <h1 className="brand-title">ExamShield</h1>
          <p className="brand-subtitle">{formData.role === "student" ? "Student Self-Registration Portal" : "Staff Self-Registration Portal"}</p>
        </div>

        {/* Card */}
        <div className="login-card glass-card p-4">
          <div className="d-flex align-items-center mb-4">
            <Link to="/student/login" className="btn btn-link text-white p-0 me-3">
              <FiArrowLeft size={20} />
            </Link>
            <div>
              <h2 className="login-heading mb-0 text-start">Create Account</h2>
              <p className="login-subheading mb-0 text-start">{formData.role === "student" ? "Register as a candidate for the entrance exam" : "Register as a staff member of the system"}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <h5 className="text-white-50 border-bottom border-secondary pb-2 mb-3">1. Personal Details</h5>
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label-custom">Full Name *</label>
                <div className="input-wrapper">
                  <span className="input-icon"><FiUser size={16} /></span>
                  <input
                    type="text"
                    name="name"
                    className="form-control-custom with-icon"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label-custom">Email Address *</label>
                <div className="d-flex gap-2">
                  <div className="input-wrapper w-100">
                    <span className="input-icon"><FiMail size={16} /></span>
                    <input
                      type="email"
                      name="email"
                      className="form-control-custom with-icon"
                      placeholder="yourname@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isLoading || otpSent}
                      required
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary-custom px-3 py-2 btn-sm text-nowrap"
                    onClick={handleSendOTP}
                    disabled={sendingOTP || !formData.email.trim() || isLoading}
                    style={{ height: "45px" }}
                  >
                    {sendingOTP ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
                  </button>
                </div>
              </div>
            </div>

            {otpSent && (
              <div className="row">
                <div className="col-12 mb-3">
                  <div className="p-3 rounded border border-info animate-fade-in-up" style={{ background: "rgba(13, 202, 240, 0.05)" }}>
                    <label className="form-label-custom fw-bold text-info mb-2">Enter the 6-Digit Email OTP Code *</label>
                    <input
                      type="text"
                      className="form-control-custom text-center text-white"
                      placeholder="Enter OTP Code (e.g. 482910)"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                      disabled={isLoading}
                      style={{ fontSize: "1.2rem", letterSpacing: "4px", fontWeight: "bold", background: "rgba(0,0,0,0.2)" }}
                      required
                    />
                    <small className="text-info mt-2 d-block">
                      Check your inbox/spam folder for the verification code. If in development/offline mode, the code is printed in the server console log!
                    </small>
                  </div>
                </div>
              </div>
            )}

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label-custom">Password *</label>
                <div className="input-wrapper">
                  <span className="input-icon"><FiLock size={16} /></span>
                  <input
                    type="password"
                    name="password"
                    className="form-control-custom with-icon"
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label-custom">Phone Number</label>
                <div className="input-wrapper">
                  <span className="input-icon"><FiPhone size={16} /></span>
                  <input
                    type="text"
                    name="phone"
                    className="form-control-custom with-icon"
                    placeholder="10 digit number"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {formData.role === "student" && (
              <>
                <h5 className="text-white-50 border-bottom border-secondary pb-2 mb-3 mt-4">2. Academic & Exam Details</h5>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label-custom">Date of Birth *</label>
                    <div className="input-wrapper">
                      <span className="input-icon"><FiCalendar size={16} /></span>
                      <input
                        type="date"
                        name="dob"
                        className="form-control-custom with-icon text-white"
                        value={formData.dob}
                        onChange={handleChange}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label-custom">Government ID Number *</label>
                    <div className="input-wrapper">
                      <span className="input-icon"><FiCreditCard size={16} /></span>
                      <input
                        type="text"
                        name="idNumber"
                        className="form-control-custom with-icon"
                        placeholder="Aadhaar or Govt ID Card No"
                        value={formData.idNumber}
                        onChange={handleChange}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label-custom">Registration / Roll Number *</label>
                    <div className="input-wrapper">
                      <span className="input-icon"><FiUser size={16} /></span>
                      <input
                        type="text"
                        name="rollNumber"
                        className="form-control-custom with-icon"
                        placeholder="e.g. MCA26002"
                        value={formData.rollNumber}
                        onChange={handleChange}
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-3 mb-3">
                    <label className="form-label-custom">Course *</label>
                    <div className="input-wrapper">
                      <span className="input-icon"><FiBook size={16} /></span>
                      <select
                        name="course"
                        className="form-control-custom with-icon text-white bg-dark"
                        value={formData.course}
                        onChange={handleChange}
                        disabled={isLoading}
                        required
                      >
                        <option value="MCA">MCA</option>
                        <option value="BCA">BCA</option>
                        <option value="B.Tech CSE">B.Tech CSE</option>
                        <option value="B.Sc CS">B.Sc CS</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-3 mb-3">
                    <label className="form-label-custom">Semester *</label>
                    <input
                      type="number"
                      name="semester"
                      className="form-control-custom"
                      min="1"
                      max="8"
                      value={formData.semester}
                      onChange={handleChange}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label-custom">Exam Center</label>
                    <input
                      type="text"
                      name="examCenter"
                      className="form-control-custom"
                      value={formData.examCenter}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label-custom">Exam Subject</label>
                    <input
                      type="text"
                      name="examSubject"
                      className="form-control-custom"
                      value={formData.examSubject}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label-custom">Exam Date</label>
                    <input
                      type="text"
                      name="examDate"
                      className="form-control-custom"
                      value={formData.examDate}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label-custom">Exam Time</label>
                    <input
                      type="text"
                      name="examTime"
                      className="form-control-custom"
                      value={formData.examTime}
                      onChange={handleChange}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className="btn-custom mt-4 w-100 py-3 d-flex align-items-center justify-content-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Registering...
                </>
              ) : (
                "Complete Registration"
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-white-50">Already have an account? </span>
            <Link to="/student/login" className="auth-link">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
