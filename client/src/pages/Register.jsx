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

  const [otpSent, setOtpSent] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [showOtpModal, setShowOtpModal] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "idNumber") {
      // Only allow digits and limit to max 12 characters for Aadhaar
      const cleanValue = value.replace(/\D/g, "").slice(0, 12);
      setFormData((prev) => ({ ...prev, [name]: cleanValue }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const { name, email, password, rollNumber, course, dob, idNumber } = formData;

    // Validate form inputs (excluding OTP)
    if (!name.trim() || !email.trim() || !password.trim() || !rollNumber.trim() || !course || !dob || !idNumber.trim() || !selectedFile) {
      toast.warn("Please fill in all required fields (marked with *), including your Photo Upload");
      return;
    }

    // Aadhaar number 12-digit validation
    const cleanIdNumber = idNumber.trim().replace(/\D/g, "");
    if (cleanIdNumber.length !== 12) {
      toast.warn("Aadhaar number must be exactly 12 digits");
      return;
    }

    // Email regex validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      toast.warn("Please enter a valid email address format");
      return;
    }

    // If OTP modal is not shown yet, send OTP first and open modal
    if (!showOtpModal) {
      setSendingOTP(true);
      try {
        const data = await sendOTPAPI({ email: email.trim() });
        if (data.success) {
          setOtpSent(true);
          setShowOtpModal(true);
          toast.success("Verification OTP code sent to your email! Please check.");
        }
      } catch (err) {
        const message = err.response?.data?.message || "Failed to send verification OTP.";
        toast.error(message);
      } finally {
        setSendingOTP(false);
      }
      return;
    }

    // If OTP modal is shown, verify OTP and submit registration
    if (!otp.trim() || otp.trim().length !== 6) {
      toast.warn("Please enter the 6-digit verification code");
      return;
    }

    setIsLoading(true);
    try {
      const payload = new FormData();
      payload.append("name", name.trim());
      payload.append("email", email.trim().toLowerCase());
      payload.append("password", password);
      payload.append("role", "student");
      if (formData.phone) payload.append("phone", formData.phone.trim());
      payload.append("rollNumber", rollNumber.trim().toUpperCase());
      payload.append("course", course);
      payload.append("semester", formData.semester);
      payload.append("dob", dob);
      payload.append("idNumber", idNumber.trim());
      payload.append("examCenter", formData.examCenter);
      payload.append("examSubject", formData.examSubject);
      payload.append("examDate", formData.examDate);
      payload.append("examTime", formData.examTime);
      payload.append("otp", otp.trim());
      payload.append("idCardImage", selectedFile);

      await studentRegisterAPI(payload);

      toast.success("Registration successful! Log in to view your approval status. 🎉", { autoClose: 6000 });
      setShowOtpModal(false);
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
              <div className="col-12 mb-3">
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
            </div>

            <div className="row">
              <div className="col-12 mb-3">
                <label className="form-label-custom">Email Address *</label>
                <div className="input-wrapper">
                  <span className="input-icon"><FiMail size={16} /></span>
                  <input
                    type="email"
                    name="email"
                    className="form-control-custom with-icon"
                    placeholder="yourname@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading || showOtpModal}
                    required
                  />
                </div>
              </div>
            </div>

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

            <div className="row">
              <div className="col-12 mb-3">
                <label className="form-label-custom">ID Card Reference Photo / Passport Photo *</label>
                <div className="input-wrapper">
                  <input
                    type="file"
                    name="idCardImage"
                    className="form-control-custom text-white py-2"
                    accept="image/*"
                    onChange={handleFileChange}
                    required
                    disabled={isLoading}
                    style={{ background: "rgba(0,0,0,0.2)" }}
                  />
                </div>
                <small className="text-muted mt-1 d-block">This image/photo will be displayed to security personnel during gate verification checks.</small>
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
                    <label className="form-label-custom">Aadhaar Number (12 Digits) *</label>
                    <div className="input-wrapper">
                      <span className="input-icon"><FiCreditCard size={16} /></span>
                      <input
                        type="text"
                        name="idNumber"
                        className="form-control-custom with-icon"
                        placeholder="12-digit Aadhaar Number"
                        value={formData.idNumber}
                        onChange={handleChange}
                        maxLength={12}
                        inputMode="numeric"
                        pattern="\d{12}"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    {formData.idNumber && formData.idNumber.length > 0 && formData.idNumber.length < 12 && (
                      <small className="text-warning mt-1 d-block">
                        Aadhaar number must be exactly 12 digits ({formData.idNumber.length}/12)
                      </small>
                    )}
                    {formData.idNumber && formData.idNumber.length === 12 && (
                      <small className="text-success mt-1 d-block">
                        ✓ Valid 12-digit Aadhaar format
                      </small>
                    )}
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
                      max="20"
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
              disabled={isLoading || sendingOTP}
            >
              {sendingOTP ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Sending Verification Code...
                </>
              ) : "Verify & Complete Registration"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <span className="text-white-50">Already have an account? </span>
            <Link to="/student/login" className="auth-link">Sign In</Link>
          </div>
        </div>
      </div>

      {/* Verification OTP Modal Overlay */}
      {showOtpModal && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center animate-fade-in" style={{ background: "rgba(0,0,0,0.85)", zIndex: 1050, backdropFilter: "blur(12px)" }}>
          <div className="glass-card p-4 text-center animate-fade-in-up" style={{ maxWidth: "450px", width: "90%", border: "1px solid rgba(255, 255, 255, 0.15)", background: "rgba(20, 20, 30, 0.9)" }}>
            <h4 className="text-white mb-2 fw-bold">Email Verification</h4>
            <p className="text-white-50 small mb-4">We have sent a 6-digit verification code to <strong className="text-white">{formData.email}</strong>. Please enter the code below to verify your email.</p>
            
            <div className="mb-4">
              <input
                type="text"
                className="form-control-custom text-center text-white"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                required
                style={{ fontSize: "1.6rem", letterSpacing: "6px", fontWeight: "bold", background: "rgba(0,0,0,0.3)" }}
              />
              <small className="text-info mt-3 d-block">
                Check spam if you don't see it. In offline dev mode, the code is printed in the server console log!
              </small>
            </div>
            
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary w-50 py-2 text-white"
                style={{ borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)" }}
                onClick={() => setShowOtpModal(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary-custom w-50 py-2 d-flex align-items-center justify-content-center gap-2"
                onClick={() => handleSubmit()}
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    Verifying...
                  </>
                ) : "Verify & Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;
