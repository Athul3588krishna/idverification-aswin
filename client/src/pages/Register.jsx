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
import {
  FiUser,
  FiMail,
  FiLock,
  FiPhone,
  FiBook,
  FiCalendar,
  FiCreditCard,
  FiShield,
  FiArrowLeft,
  FiZap,
  FiCheckCircle,
  FiRefreshCw,
  FiSend,
  FiCamera
} from "react-icons/fi";

import useAuth from "../hooks/useAuth";
import { studentRegisterAPI, sendOTPAPI, extractIdCardDetailsAPI } from "../api/authAPI";

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
    examCenter: "Main Campus (Malappuram)",
    examSubject: "Entrance Examination 2026",
    telegramChatId: ""
  });

  const [isLoading, setIsLoading] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [otp, setOtp] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [studentPhotoFile, setStudentPhotoFile] = useState(null);
  const [studentPhotoPreview, setStudentPhotoPreview] = useState(null);
  const [showOtpModal, setShowOtpModal] = useState(false);

  const handleStudentPhotoChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setStudentPhotoFile(file);
      setStudentPhotoPreview(URL.createObjectURL(file));
    }
  };

  // OCR Auto-extraction states
  const [isScanning, setIsScanning] = useState(false);
  const [extractedFields, setExtractedFields] = useState([]);

  const scanFileForOCR = async (file) => {
    if (!file) return;
    setIsScanning(true);
    const scanPayload = new FormData();
    scanPayload.append("idCardImage", file);

    try {
      toast.info("🔍 Scanning ID Card with OCR... Please wait.", { autoClose: 2000 });
      const data = await extractIdCardDetailsAPI(scanPayload);
      if (data.success && data.extracted) {
        const ext = data.extracted;
        const autoFilledList = [];

        setFormData((prev) => {
          const updated = { ...prev };
          if (ext.name) {
            updated.name = ext.name;
            autoFilledList.push("name");
          }
          if (ext.rollNumber) {
            updated.rollNumber = ext.rollNumber;
            autoFilledList.push("rollNumber");
          }
          if (ext.dob) {
            updated.dob = ext.dob;
            autoFilledList.push("dob");
          }
          if (ext.idNumber) {
            updated.idNumber = ext.idNumber;
            autoFilledList.push("idNumber");
          }
          if (ext.course) {
            updated.course = ext.course;
            autoFilledList.push("course");
          }
          if (ext.semester) {
            updated.semester = ext.semester;
            autoFilledList.push("semester");
          }
          return updated;
        });

        setExtractedFields(autoFilledList);
        if (autoFilledList.length > 0) {
          toast.success(`✨ Auto-detected ${autoFilledList.length} fields from your ID Card!`);
        } else {
          toast.info("Image uploaded. Could not detect text automatically; you can type the details manually.");
        }
      }
    } catch (err) {
      console.warn("OCR auto-fill failed:", err);
      toast.info("Could not auto-extract details from ID card. Please enter them manually.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      scanFileForOCR(file);
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
    if (name === "name") {
      // Allow only alphabets and spaces (strip digits and special characters)
      const cleanValue = value.replace(/[^a-zA-Z\s]/g, "");
      setFormData((prev) => ({ ...prev, [name]: cleanValue }));
      return;
    }
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

    const { name, email, password, phone, rollNumber, course, dob, idNumber } = formData;

    // Validate form inputs (excluding OTP)
    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim() || !rollNumber.trim() || !course || !dob || !idNumber.trim() || (!studentPhotoFile && !selectedFile)) {
      toast.warn("Please fill in all required fields (marked with *), including your Candidate Passport Photo");
      return;
    }

    // Name alphabet validation (only letters and spaces)
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(name.trim())) {
      toast.warn("Full Name must contain only alphabets and spaces");
      return;
    }

    // Phone number 10-digit validation
    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      toast.warn("Phone number must be exactly 10 digits");
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
      payload.append("phone", cleanPhone);
      payload.append("rollNumber", rollNumber.trim().toUpperCase());
      payload.append("course", course);
      payload.append("semester", formData.semester);
      payload.append("dob", dob);
      payload.append("idNumber", idNumber.trim());
      payload.append("examCenter", formData.examCenter);
      payload.append("examSubject", formData.examSubject);
      payload.append("telegramChatId", formData.telegramChatId ? formData.telegramChatId.trim() : "");
      payload.append("otp", otp.trim());
      if (studentPhotoFile) {
        payload.append("studentPhoto", studentPhotoFile);
      }
      if (selectedFile) {
        payload.append("idCardImage", selectedFile);
      }

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
                <label className="form-label-custom">
                  Full Name *
                  {extractedFields.includes("name") && (
                    <span className="badge bg-success ms-2 py-0 px-2" style={{ fontSize: "0.68rem" }}>
                      ✨ Auto-filled
                    </span>
                  )}
                </label>
                <div className="input-wrapper">
                  <span className="input-icon"><FiUser size={16} /></span>
                  <input
                    type="text"
                    name="name"
                    className="form-control-custom with-icon"
                    placeholder="Enter your full name (alphabets only)"
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
                <label className="form-label-custom">Phone Number *</label>
                <div className="input-wrapper">
                  <span className="input-icon"><FiPhone size={16} /></span>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control-custom with-icon"
                    placeholder="10 digit phone number"
                    value={formData.phone}
                    maxLength={10}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setFormData((p) => ({ ...p, phone: val }));
                    }}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="row">
              {/* 1. Candidate Passport Photo (For Admit Card) */}
              <div className="col-md-6 mb-3">
                <label className="form-label-custom mb-1 d-flex align-items-center justify-content-between">
                  <span>Candidate Passport Photo *</span>
                  <span className="badge bg-primary" style={{ fontSize: "0.68rem" }}>Admit Card Photo</span>
                </label>
                <div className="input-wrapper mb-2">
                  <input
                    type="file"
                    name="studentPhoto"
                    className="form-control-custom text-white py-2"
                    accept="image/*"
                    onChange={handleStudentPhotoChange}
                    disabled={isLoading}
                    style={{ background: "rgba(0,0,0,0.2)" }}
                  />
                </div>

                {studentPhotoPreview ? (
                  <div
                    className="p-2 rounded d-flex align-items-center"
                    style={{
                      background: "rgba(25, 135, 84, 0.12)",
                      border: "1px solid rgba(25, 135, 84, 0.3)",
                    }}
                  >
                    <img
                      src={studentPhotoPreview}
                      alt="Passport Preview"
                      style={{
                        width: "48px",
                        height: "58px",
                        objectFit: "cover",
                        borderRadius: "4px",
                        border: "1px solid rgba(255,255,255,0.3)",
                      }}
                      className="me-2"
                    />
                    <div style={{ overflow: "hidden" }}>
                      <div className="text-success fw-bold" style={{ fontSize: "0.8rem" }}>
                        <FiCheckCircle className="me-1" />
                        Admit Card Photo Ready
                      </div>
                      <small className="text-muted text-truncate d-block" style={{ fontSize: "0.72rem" }}>
                        {studentPhotoFile?.name} ({(studentPhotoFile?.size / 1024).toFixed(1)} KB)
                      </small>
                    </div>
                  </div>
                ) : (
                  <small className="text-muted d-block" style={{ fontSize: "0.76rem" }}>
                    📸 Official passport photo to be printed on your Hall Ticket / Admit Card.
                  </small>
                )}
              </div>

              {/* 2. Student ID Card (For OCR Auto-Fill & Admin Verification) */}
              <div className="col-md-6 mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label-custom mb-0">
                    Student ID Card (OCR Scan)
                  </label>
                  {selectedFile && !isScanning && (
                    <button
                      type="button"
                      className="btn btn-sm btn-link text-info text-decoration-none p-0 d-flex align-items-center"
                      onClick={() => scanFileForOCR(selectedFile)}
                      title="Re-run OCR scanning on this card image"
                    >
                      <FiRefreshCw size={12} className="me-1" />
                      <span>Re-scan</span>
                    </button>
                  )}
                </div>

                <div className="input-wrapper mb-2">
                  <input
                    type="file"
                    name="idCardImage"
                    className="form-control-custom text-white py-2"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isLoading || isScanning}
                    style={{ background: "rgba(0,0,0,0.2)" }}
                  />
                </div>

                {/* Scanning Live State */}
                {isScanning && (
                  <div
                    className="p-2 rounded d-flex align-items-center text-info"
                    style={{
                      background: "rgba(13, 202, 240, 0.12)",
                      border: "1px solid rgba(13, 202, 240, 0.3)",
                      fontSize: "0.82rem",
                    }}
                  >
                    <div className="spinner-border spinner-border-sm me-2 text-info" role="status"></div>
                    <span>
                      <FiZap className="me-1" />
                      Scanning ID card with OCR...
                    </span>
                  </div>
                )}

                {/* Extracted preview banner & thumbnail */}
                {previewUrl && !isScanning && (
                  <div
                    className="p-2 rounded d-flex align-items-center justify-content-between"
                    style={{
                      background:
                        extractedFields.length > 0
                          ? "rgba(25, 135, 84, 0.12)"
                          : "rgba(255, 255, 255, 0.05)",
                      border:
                        extractedFields.length > 0
                          ? "1px solid rgba(25, 135, 84, 0.3)"
                          : "1px solid rgba(255, 255, 255, 0.1)",
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <img
                        src={previewUrl}
                        alt="Card Preview"
                        style={{
                          width: "48px",
                          height: "36px",
                          objectFit: "cover",
                          borderRadius: "4px",
                          border: "1px solid rgba(255,255,255,0.2)",
                        }}
                        className="me-2"
                      />
                      <div>
                        {extractedFields.length > 0 ? (
                          <div className="text-success" style={{ fontSize: "0.8rem" }}>
                            <FiCheckCircle className="me-1" />
                            Auto-filled {extractedFields.length} field(s)
                          </div>
                        ) : (
                          <div className="text-white-50" style={{ fontSize: "0.8rem" }}>
                            ID Card attached
                          </div>
                        )}
                        <small className="text-muted d-block text-truncate" style={{ fontSize: "0.7rem", maxWidth: "120px" }}>
                          {selectedFile?.name}
                        </small>
                      </div>
                    </div>

                    {extractedFields.length > 0 && (
                      <span className="badge bg-success" style={{ fontSize: "0.68rem" }}>
                        ✨ Auto-Filled
                      </span>
                    )}
                  </div>
                )}

                {!previewUrl && !isScanning && (
                  <small className="text-muted d-block" style={{ fontSize: "0.76rem" }}>
                    💡 Tip: Auto-extracts Name, Roll No, DOB, and ID.
                  </small>
                )}
              </div>
            </div>

            {formData.role === "student" && (
              <>
                <h5 className="text-white-50 border-bottom border-secondary pb-2 mb-3 mt-4">2. Academic & Exam Details</h5>
                
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label-custom">
                      Date of Birth *
                      {extractedFields.includes("dob") && (
                        <span className="badge bg-success ms-2 py-0 px-2" style={{ fontSize: "0.68rem" }}>
                          ✨ Auto-filled
                        </span>
                      )}
                    </label>
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
                    <label className="form-label-custom">
                      Aadhaar Number (12 Digits) *
                      {extractedFields.includes("idNumber") && (
                        <span className="badge bg-success ms-2 py-0 px-2" style={{ fontSize: "0.68rem" }}>
                          ✨ Auto-filled
                        </span>
                      )}
                    </label>
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
                    <label className="form-label-custom">
                      Registration / Roll Number *
                      {extractedFields.includes("rollNumber") && (
                        <span className="badge bg-success ms-2 py-0 px-2" style={{ fontSize: "0.68rem" }}>
                          ✨ Auto-filled
                        </span>
                      )}
                    </label>
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
                    <label className="form-label-custom">
                      Course *
                      {extractedFields.includes("course") && (
                        <span className="badge bg-success ms-2 py-0 px-2" style={{ fontSize: "0.68rem" }}>
                          ✨ Auto-filled
                        </span>
                      )}
                    </label>
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
                    <label className="form-label-custom">
                      Semester *
                      {extractedFields.includes("semester") && (
                        <span className="badge bg-success ms-2 py-0 px-2" style={{ fontSize: "0.68rem" }}>
                          ✨ Auto-filled
                        </span>
                      )}
                    </label>
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
                    <label className="form-label-custom">Preferred Examination Zone / Campus *</label>
                    <select
                      name="examCenter"
                      className="form-control-custom"
                      value={formData.examCenter}
                      onChange={handleChange}
                      disabled={isLoading}
                    >
                      <option value="Main Campus (Malappuram)">Main Campus (Malappuram)</option>
                      <option value="North Zone Campus (Kozhikode)">North Zone Campus (Kozhikode)</option>
                      <option value="South Zone Campus (Ernakulam)">South Zone Campus (Ernakulam)</option>
                      <option value="Central Zone Campus (Thrissur)">Central Zone Campus (Thrissur)</option>
                    </select>
                    <small className="text-secondary d-block mt-1" style={{ fontSize: "0.72rem" }}>
                      🔒 Specific Exam Hall (Room Number) & Desk Number will be allocated upon Admin Verification.
                    </small>
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
                  <div className="col-12 mb-3">
                    <label className="form-label-custom">
                      Telegram Chat ID / Username * (For Exam Date & Room Notification)
                    </label>
                    <div className="input-wrapper">
                      <span className="input-icon"><FiSend size={16} /></span>
                      <input
                        type="text"
                        name="telegramChatId"
                        className="form-control-custom with-icon"
                        placeholder="e.g. 123456789 or @username"
                        value={formData.telegramChatId}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                    </div>
                    <small className="text-info d-block mt-1" style={{ fontSize: "0.74rem" }}>
                      📱 <strong>Important:</strong> Your Exam Date, Room (Hall) Number, and Time will be sent directly to your Telegram once the Admin approves your registration. (Tip: Send <code>/start</code> to <code>@userinfobot</code> on Telegram to check your numeric Chat ID).
                    </small>
                  </div>
                </div>

                {/* Confidential Scheduling Notice */}
                <div className="p-3 mb-3 rounded" style={{ background: "rgba(99, 102, 241, 0.12)", border: "1px solid rgba(99, 102, 241, 0.3)" }}>
                  <div className="d-flex align-items-center gap-2 text-info mb-1 fw-bold" style={{ fontSize: "0.85rem" }}>
                    <FiLock size={15} />
                    <span>Confidential Exam Scheduling Protocol</span>
                  </div>
                  <p className="text-secondary mb-0" style={{ fontSize: "0.75rem", lineHeight: "1.4" }}>
                    To uphold strict exam integrity, specific <strong>Exam Date</strong>, <strong>Time Slot</strong>, and <strong>Allocated Room / Desk</strong> are confidential during registration and officially allocated only upon Administrator verification. You will be instantly notified via Telegram upon approval.
                  </p>
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
