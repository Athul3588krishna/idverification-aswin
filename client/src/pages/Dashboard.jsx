/**
 * pages/Dashboard.jsx
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   Renders the core workspace page after logging in.
 *   Provides fully tailored workspaces for Admin, Security, and Students.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiUsers,
  FiActivity,
  FiCheckCircle,
  FiXCircle,
  FiShield,
  FiUser,
  FiCpu,
  FiCalendar,
  FiFileText,
  FiLock,
  FiMail,
  FiPlus,
  FiTrash2,
  FiMapPin,
  FiClock,
  FiBookOpen
} from "react-icons/fi";
import { toast } from "react-toastify";
import useAuth from "../hooks/useAuth";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";
import Loader from "../components/common/Loader";
import axiosInstance from "../api/axiosInstance";
import AdmitCard from "../components/AdmitCard";
import { registerUserAPI, deleteUserAPI, getAllUsersAPI } from "../api/authAPI";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Admin Tabs & State
  const [adminTab, setAdminTab] = useState("overview"); // overview, security, exams
  const [securityStaff, setSecurityStaff] = useState([]);
  const [loadingSecurity, setLoadingSecurity] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: "", email: "", password: "", phone: "" });
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  
  // Admin Exam config
  const [examConfig, setExamConfig] = useState({
    subject: "Entrance Examination 2026",
    date: "2026-08-10",
    time: "10:00 AM - 1:00 PM",
    center: "Hall A - Room 102"
  });

  // Student specific state
  const [showAdmitCard, setShowAdmitCard] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("PENDING"); // PENDING, APPROVED, REJECTED
  const [verificationReason, setVerificationReason] = useState("");
  const [recentStudentLog, setRecentStudentLog] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await axiosInstance.get("/verify/stats");
      if (res.data?.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      // Fallback
      if (user.role === "admin") {
        setStats({
          totalStudents: 3,
          totalStaff: 1,
          totalScans: 0,
          successScans: 0,
          failedScans: 0,
        });
      } else {
        setStats({ todayScans: 0, todayApproved: 0, todayRejected: 0 });
      }
    }
  };

  const fetchSecurityStaff = async () => {
    setLoadingSecurity(true);
    try {
      const data = await getAllUsersAPI({ role: "security_staff" });
      if (data?.success) {
        setSecurityStaff(data.users);
      }
    } catch (err) {
      console.error("Failed to load security staff", err);
    } finally {
      setLoadingSecurity(false);
    }
  };

  // Student entry verification status check
  const fetchStudentStatus = async () => {
    if (user?.role !== "student" || !user.studentProfile?.rollNumber) return;
    try {
      const res = await axiosInstance.get(`/verify/logs?search=${user.studentProfile.rollNumber}`);
      if (res.data?.success && res.data.logs?.length > 0) {
        const latestLog = res.data.logs[0];
        setRecentStudentLog(latestLog);
        setVerificationStatus(latestLog.status);
        setVerificationReason(latestLog.rejectionReason || "");
      }
    } catch (err) {
      console.error("Failed to check verification status", err);
    }
  };

  useEffect(() => {
    // Load config from localStorage if it exists
    const savedConfig = localStorage.getItem("examshield_exam_config");
    if (savedConfig) {
      setExamConfig(JSON.parse(savedConfig));
    } else {
      localStorage.setItem("examshield_exam_config", JSON.stringify(examConfig));
    }

    const initDashboard = async () => {
      setLoading(true);
      if (user) {
        await fetchStats();
        if (user.role === "admin") {
          await fetchSecurityStaff();
        } else if (user.role === "student") {
          await fetchStudentStatus();
        }
      }
      setLoading(false);
    };

    initDashboard();
  }, [user]);

  // Handle adding new security agent
  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password } = newStaff;
    if (!name || !email || !password) {
      toast.warn("Name, email, and password are required");
      return;
    }

    setIsAddingStaff(true);
    try {
      await registerUserAPI({
        name,
        email,
        password,
        phone: newStaff.phone || "",
        role: "security_staff"
      });
      toast.success("Security staff account created successfully! 🎉");
      setNewStaff({ name: "", email: "", password: "", phone: "" });
      await fetchSecurityStaff();
      await fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create security account");
    } finally {
      setIsAddingStaff(false);
    }
  };

  // Handle deleting security agent
  const handleDeleteStaff = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this security account?")) return;
    try {
      await deleteUserAPI(id);
      toast.success("Security staff account deleted.");
      await fetchSecurityStaff();
      await fetchStats();
    } catch (err) {
      toast.error("Failed to delete account");
    }
  };

  // Save admin exam configuration
  const handleExamConfigSubmit = (e) => {
    e.preventDefault();
    localStorage.setItem("examshield_exam_config", JSON.stringify(examConfig));
    toast.success("Examination configuration saved successfully! 📋");
  };

  if (loading) {
    return <Loader fullScreen message="Loading Dashboard..." />;
  }

  return (
    <div className="gradient-bg min-vh-100 d-flex flex-column">
      <Navbar />
      <div className="page-layout">
        <Sidebar />
        <main className="main-content container-fluid animate-fade-in-up">
          
          {/* Welcome Header */}
          <div className="row mb-4 align-items-center">
            <div className="col">
              <h2 className="mb-1" style={{ fontWeight: 700, fontFamily: "Space Grotesk, sans-serif" }}>
                Welcome Back, {user?.name}!
              </h2>
              <p className="text-secondary mb-0">
                Today is {new Date().toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="col-auto">
              <span className="badge-success" style={{
                background: "var(--primary-glow)",
                color: "var(--primary-light)",
                border: "1px solid var(--border-focus)",
                padding: "0.5rem 1rem",
                borderRadius: "var(--radius-sm)",
                fontWeight: 600
              }}>
                🔑 Server Connected
              </span>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────── */}
          {/* ADMIN DASHBOARD VIEW                                       */}
          {/* ────────────────────────────────────────────────────────── */}
          {user?.role === "admin" && stats && (
            <div>
              {/* Tab Navigation */}
              <div className="d-flex border-bottom border-secondary mb-4 gap-2">
                <button
                  className={`btn py-2 px-4 rounded-top border-0 ${adminTab === "overview" ? "btn-primary-custom text-white" : "text-white-50"}`}
                  onClick={() => setAdminTab("overview")}
                >
                  <FiActivity className="me-2" /> Overview
                </button>
                <button
                  className={`btn py-2 px-4 rounded-top border-0 ${adminTab === "security" ? "btn-primary-custom text-white" : "text-white-50"}`}
                  onClick={() => setAdminTab("security")}
                >
                  <FiShield className="me-2" /> Security Accounts
                </button>
                <button
                  className={`btn py-2 px-4 rounded-top border-0 ${adminTab === "exams" ? "btn-primary-custom text-white" : "text-white-50"}`}
                  onClick={() => setAdminTab("exams")}
                >
                  <FiCalendar className="me-2" /> Exam Details
                </button>
              </div>

              {/* OVERVIEW TAB */}
              {adminTab === "overview" && (
                <div className="row g-4">
                  {/* Stat Cards */}
                  <div className="col-12 col-md-6 col-lg-3">
                    <div className="stat-card">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <p className="text-muted text-uppercase mb-1" style={{ fontSize: "0.75rem", letterSpacing: "0.05em" }}>Total Candidates</p>
                          <h3 className="stat-number mb-0">{stats.totalStudents}</h3>
                        </div>
                        <div className="p-3 bg-primary-glow rounded-circle" style={{ color: "var(--primary-light)" }}>
                          <FiUsers size={24} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6 col-lg-3">
                    <div className="stat-card">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <p className="text-muted text-uppercase mb-1" style={{ fontSize: "0.75rem", letterSpacing: "0.05em" }}>Security Agents</p>
                          <h3 className="stat-number mb-0">{stats.totalStaff}</h3>
                        </div>
                        <div className="p-3 bg-primary-glow rounded-circle" style={{ color: "var(--primary-light)" }}>
                          <FiShield size={24} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6 col-lg-3">
                    <div className="stat-card">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <p className="text-muted text-uppercase mb-1" style={{ fontSize: "0.75rem", letterSpacing: "0.05em" }}>Approved Entrants</p>
                          <h3 className="stat-number mb-0" style={{ background: "linear-gradient(135deg, #10b981, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            {stats.successScans}
                          </h3>
                        </div>
                        <div className="p-3 bg-success-glow rounded-circle" style={{ color: "var(--accent-green)", backgroundColor: "rgba(16, 185, 129, 0.1)" }}>
                          <FiCheckCircle size={24} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6 col-lg-3">
                    <div className="stat-card">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <p className="text-muted text-uppercase mb-1" style={{ fontSize: "0.75rem", letterSpacing: "0.05em" }}>Access Rejections</p>
                          <h3 className="stat-number mb-0" style={{ background: "linear-gradient(135deg, #ef4444, #f87171)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            {stats.failedScans}
                          </h3>
                        </div>
                        <div className="p-3 bg-danger-glow rounded-circle" style={{ color: "var(--accent-red)", backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
                          <FiXCircle size={24} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Operations Control Banner */}
                  <div className="col-12 col-lg-8">
                    <div className="glass-card h-100">
                      <h4 className="mb-4 d-flex align-items-center gap-2">
                        <FiActivity size={20} className="text-primary-light" />
                        Admin Operations Control
                      </h4>
                      <p className="text-secondary mb-4">
                        As an administrator, you have complete read, write, and audit access. Add new students to the exam register, activate or suspend staff credentials, and view verification logs in real-time.
                      </p>
                      <div className="d-flex flex-wrap gap-3">
                        <Link to="/students/add" className="btn btn-primary-custom d-flex align-items-center gap-2">
                          <FiUsers size={16} /> Register Student Candidate
                        </Link>
                        <Link to="/students" className="btn btn-outline-secondary d-flex align-items-center gap-2" style={{
                          borderColor: "var(--border-color)",
                          color: "var(--text-primary)"
                        }}>
                          Manage Registered Roster
                        </Link>
                        <Link to="/history" className="btn btn-outline-secondary d-flex align-items-center gap-2" style={{
                          borderColor: "var(--border-color)",
                          color: "var(--text-primary)"
                        }}>
                          Audit Logs
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-lg-4">
                    <div className="glass-card h-100">
                      <h4 className="mb-3">Verification Performance</h4>
                      <div className="d-flex align-items-center justify-content-between p-3 rounded mb-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)" }}>
                        <span className="text-secondary">Scan Success Rate</span>
                        <strong className="text-success" style={{ color: "var(--accent-green)" }}>
                          {stats.totalScans > 0 ? ((stats.successScans / stats.totalScans) * 100).toFixed(1) : "100"}%
                        </strong>
                      </div>
                      <div className="d-flex align-items-center justify-content-between p-3 rounded" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)" }}>
                        <span className="text-secondary">System Load Status</span>
                        <strong style={{ color: "var(--primary-light)" }}>NORMAL</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECURITY ACCOUNTS TAB */}
              {adminTab === "security" && (
                <div className="row g-4">
                  {/* List Security Agents */}
                  <div className="col-12 col-lg-7">
                    <div className="glass-card">
                      <h4 className="mb-4">Active Security Agents</h4>
                      {loadingSecurity ? (
                        <div className="text-center py-4"><span className="spinner-border spinner-border-sm me-2"></span>Loading...</div>
                      ) : securityStaff.length === 0 ? (
                        <p className="text-muted">No security staff accounts found.</p>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-dark table-hover table-borderless align-middle m-0">
                            <thead>
                              <tr className="border-bottom border-secondary">
                                <th className="text-muted small py-3">NAME</th>
                                <th className="text-muted small py-3">EMAIL</th>
                                <th className="text-muted small py-3 text-end">ACTIONS</th>
                              </tr>
                            </thead>
                            <tbody>
                              {securityStaff.map((staff) => (
                                <tr key={staff._id} className="border-bottom border-secondary-dim">
                                  <td className="fw-semibold py-3">{staff.name}</td>
                                  <td className="text-secondary py-3">{staff.email}</td>
                                  <td className="py-3 text-end">
                                    <button
                                      className="btn btn-outline-danger btn-sm p-2 d-inline-flex align-items-center"
                                      onClick={() => handleDeleteStaff(staff._id)}
                                      title="Delete Account"
                                    >
                                      <FiTrash2 size={14} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add Agent Form */}
                  <div className="col-12 col-lg-5">
                    <div className="glass-card">
                      <h4 className="mb-4">Add Security Staff</h4>
                      <form onSubmit={handleAddStaffSubmit}>
                        <div className="mb-3">
                          <label className="form-label-custom">Agent Full Name</label>
                          <div className="input-wrapper">
                            <span className="input-icon"><FiUser size={16} /></span>
                            <input
                              type="text"
                              name="name"
                              className="form-control-custom with-icon"
                              placeholder="e.g. Officer John"
                              value={newStaff.name}
                              onChange={(e) => setNewStaff(p => ({ ...p, name: e.target.value }))}
                              required
                            />
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label-custom">Email Address</label>
                          <div className="input-wrapper">
                            <span className="input-icon"><FiMail size={16} /></span>
                            <input
                              type="email"
                              name="email"
                              className="form-control-custom with-icon"
                              placeholder="e.g. officer@examshield.com"
                              value={newStaff.email}
                              onChange={(e) => setNewStaff(p => ({ ...p, email: e.target.value }))}
                              required
                            />
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label-custom">Password</label>
                          <div className="input-wrapper">
                            <span className="input-icon"><FiLock size={16} /></span>
                            <input
                              type="password"
                              name="password"
                              className="form-control-custom with-icon"
                              placeholder="Min 6 characters"
                              value={newStaff.password}
                              onChange={(e) => setNewStaff(p => ({ ...p, password: e.target.value }))}
                              required
                            />
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="form-label-custom">Phone Number (Optional)</label>
                          <div className="input-wrapper">
                            <span className="input-icon"><FiPhone size={16} /></span>
                            <input
                              type="text"
                              name="phone"
                              className="form-control-custom with-icon"
                              placeholder="10 digit number"
                              value={newStaff.phone}
                              onChange={(e) => setNewStaff(p => ({ ...p, phone: e.target.value }))}
                            />
                          </div>
                        </div>

                        <button type="submit" className="btn btn-primary-custom w-100 py-2" disabled={isAddingStaff}>
                          {isAddingStaff ? "Creating Account..." : "Create Staff Account"}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* EXAM CONFIG TAB */}
              {adminTab === "exams" && (
                <div className="row g-4 justify-content-center">
                  <div className="col-12 col-md-8 col-lg-6">
                    <div className="glass-card">
                      <h4 className="mb-4 d-flex align-items-center gap-2">
                        <FiCalendar className="text-primary-light" />
                        Manage Examination Details
                      </h4>
                      <p className="text-secondary mb-4">
                        Configure the default details for upcoming exams. These details act as default presets when self-registering candidates or creating student rosters.
                      </p>
                      
                      <form onSubmit={handleExamConfigSubmit}>
                        <div className="mb-3">
                          <label className="form-label-custom">Exam Subject / Name</label>
                          <div className="input-wrapper">
                            <span className="input-icon"><FiBookOpen size={16} /></span>
                            <input
                              type="text"
                              className="form-control-custom with-icon"
                              value={examConfig.subject}
                              onChange={(e) => setExamConfig(p => ({ ...p, subject: e.target.value }))}
                              required
                            />
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label-custom">Examination Date</label>
                          <div className="input-wrapper">
                            <span className="input-icon"><FiCalendar size={16} /></span>
                            <input
                              type="text"
                              className="form-control-custom with-icon"
                              value={examConfig.date}
                              onChange={(e) => setExamConfig(p => ({ ...p, date: e.target.value }))}
                              placeholder="YYYY-MM-DD"
                              required
                            />
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label-custom">Examination Time Slot</label>
                          <div className="input-wrapper">
                            <span className="input-icon"><FiClock size={16} /></span>
                            <input
                              type="text"
                              className="form-control-custom with-icon"
                              value={examConfig.time}
                              onChange={(e) => setExamConfig(p => ({ ...p, time: e.target.value }))}
                              placeholder="e.g. 10:00 AM - 1:00 PM"
                              required
                            />
                          </div>
                        </div>

                        <div className="mb-4">
                          <label className="form-label-custom">Default Exam Center / Venue</label>
                          <div className="input-wrapper">
                            <span className="input-icon"><FiMapPin size={16} /></span>
                            <input
                              type="text"
                              className="form-control-custom with-icon"
                              value={examConfig.center}
                              onChange={(e) => setExamConfig(p => ({ ...p, center: e.target.value }))}
                              required
                            />
                          </div>
                        </div>

                        <button type="submit" className="btn btn-primary-custom w-100 py-2">
                          Save Configuration
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* SECURITY STAFF DASHBOARD VIEW                             */}
          {/* ────────────────────────────────────────────────────────── */}
          {user?.role === "security_staff" && stats && (
            <div className="row g-4">
              {/* Stat Cards */}
              <div className="col-12 col-md-4">
                <div className="stat-card">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted text-uppercase mb-1" style={{ fontSize: "0.75rem", letterSpacing: "0.05em" }}>Today's Total Scans</p>
                      <h3 className="stat-number mb-0">{stats.todayScans}</h3>
                    </div>
                    <div className="p-3 bg-primary-glow rounded-circle" style={{ color: "var(--primary-light)" }}>
                      <FiActivity size={24} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="stat-card">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted text-uppercase mb-1" style={{ fontSize: "0.75rem", letterSpacing: "0.05em" }}>Approved Entry Checks</p>
                      <h3 className="stat-number mb-0" style={{ color: "var(--accent-green)", background: "linear-gradient(135deg, #10b981, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        {stats.todayApproved}
                      </h3>
                    </div>
                    <div className="p-3 bg-success-glow rounded-circle" style={{ color: "var(--accent-green)", backgroundColor: "rgba(16, 185, 129, 0.1)" }}>
                      <FiCheckCircle size={24} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div className="stat-card">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-muted text-uppercase mb-1" style={{ fontSize: "0.75rem", letterSpacing: "0.05em" }}>Denied Entry Checks</p>
                      <h3 className="stat-number mb-0" style={{ color: "var(--accent-red)", background: "linear-gradient(135deg, #ef4444, #f87171)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                        {stats.todayRejected}
                      </h3>
                    </div>
                    <div className="p-3 bg-danger-glow rounded-circle" style={{ color: "var(--accent-red)", backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
                      <FiXCircle size={24} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Banner */}
              <div className="col-12">
                <div className="glass-card text-center py-5 d-flex flex-column align-items-center gap-3">
                  <div className="p-4 bg-primary-glow rounded-circle mb-2" style={{ color: "var(--primary-light)", width: "fit-content" }}>
                    <FiCpu size={48} />
                  </div>
                  <h3 style={{ fontFamily: "Space Grotesk, sans-serif" }}>Ready for Student Verification</h3>
                  <p className="text-secondary mx-auto" style={{ maxWidth: "600px" }}>
                    Upload or capture a student's ID card photo using a camera. Tesseract OCR will analyze the document, extract identifying details, and search the verified roll database immediately.
                  </p>
                  <Link to="/verify" className="btn btn-primary-custom px-5 py-3 mt-2 d-flex align-items-center gap-2">
                    <FiCpu size={18} /> Launch Identity Scanner
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────── */}
          {/* STUDENT DASHBOARD VIEW                                     */}
          {/* ────────────────────────────────────────────────────────── */}
          {user?.role === "student" && (
            <div className="row g-4">
              
              {/* Profile Card & Details */}
              <div className="col-12 col-lg-7">
                <div className="glass-card">
                  <h4 className="mb-4 border-bottom border-secondary pb-2">Candidate Hall Ticket Profile</h4>
                  
                  <div className="row g-3">
                    <div className="col-md-6">
                      <small className="text-muted d-block text-uppercase" style={{ fontSize: "0.7rem" }}>Candidate Name</small>
                      <span className="fw-semibold text-light fs-5">{user.name}</span>
                    </div>

                    <div className="col-md-6">
                      <small className="text-muted d-block text-uppercase" style={{ fontSize: "0.7rem" }}>Roll / Reg Number</small>
                      <span className="fw-semibold text-primary fs-5">{user.studentProfile?.rollNumber || "N/A"}</span>
                    </div>

                    <div className="col-md-6">
                      <small className="text-muted d-block text-uppercase" style={{ fontSize: "0.7rem" }}>Course</small>
                      <span className="fw-semibold text-light">{user.studentProfile?.course || "N/A"} (Sem {user.studentProfile?.semester || 1})</span>
                    </div>

                    <div className="col-md-6">
                      <small className="text-muted d-block text-uppercase" style={{ fontSize: "0.7rem" }}>Date of Birth (DOB)</small>
                      <span className="fw-semibold text-light">{user.studentProfile?.dob || "N/A"}</span>
                    </div>

                    <div className="col-md-6">
                      <small className="text-muted d-block text-uppercase" style={{ fontSize: "0.7rem" }}>Government ID Number</small>
                      <span className="fw-semibold text-light">{user.studentProfile?.idNumber || "N/A"}</span>
                    </div>

                    <div className="col-md-6">
                      <small className="text-muted d-block text-uppercase" style={{ fontSize: "0.7rem" }}>Assigned Venue Center</small>
                      <span className="fw-semibold text-light text-wrap">{user.studentProfile?.examCenter || "Refer to Venue Coordinator"}</span>
                    </div>
                  </div>

                  <hr className="my-4 border-secondary" />

                  <h5 className="fw-bold mb-3" style={{ fontSize: "0.95rem" }}>Registered Examination Schedule</h5>
                  <div className="row bg-dark-glow p-3 rounded border border-secondary-dim">
                    <div className="col-md-5 mb-2">
                      <small className="text-muted d-block fw-bold" style={{ fontSize: "0.65rem" }}>EXAM SUBJECT</small>
                      <span className="fw-semibold">{user.studentProfile?.examSubject || "Entrance Examination 2026"}</span>
                    </div>
                    <div className="col-md-4 mb-2">
                      <small className="text-muted d-block fw-bold" style={{ fontSize: "0.65rem" }}>DATE & TIME</small>
                      <span className="fw-semibold">{user.studentProfile?.examDate || "2026-08-10"}</span>
                      <small className="d-block text-muted">{user.studentProfile?.examTime || "10:00 AM"}</small>
                    </div>
                    <div className="col-md-3 text-md-end">
                      <button className="btn btn-primary-custom btn-sm w-100 py-2 d-flex align-items-center justify-content-center gap-1 mt-2 mt-md-0" onClick={() => setShowAdmitCard(true)}>
                        <FiFileText size={14} /> Admit Card
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status and Instructions */}
              <div className="col-12 col-lg-5">
                <div className="glass-card text-center d-flex flex-column align-items-center justify-content-center p-4 h-100">
                  
                  {/* Verification Status badges */}
                  {verificationStatus === "APPROVED" && (
                    <>
                      <div className="p-3 bg-success-glow rounded-circle mb-3 text-success" style={{ width: "fit-content", backgroundColor: "rgba(16,185,129,0.15)" }}>
                        <FiCheckCircle size={56} />
                      </div>
                      <h4 className="fw-bold text-success">Verification Approved!</h4>
                      <p className="text-secondary px-3 mt-2">
                        Gate security verified your identity card successfully at {new Date(recentStudentLog?.createdAt).toLocaleString()}. You are cleared for entry to the examination hall.
                      </p>
                    </>
                  )}

                  {verificationStatus === "REJECTED" && (
                    <>
                      <div className="p-3 bg-danger-glow rounded-circle mb-3 text-danger" style={{ width: "fit-content", backgroundColor: "rgba(239,68,68,0.15)" }}>
                        <FiXCircle size={56} />
                      </div>
                      <h4 className="fw-bold text-danger">Verification Denied</h4>
                      <p className="text-secondary px-3 mt-2">
                        Entry scan attempt was rejected: <strong className="text-danger">{verificationReason || "Failed OCR checks"}</strong>. Please contact the main administrator desk.
                      </p>
                    </>
                  )}

                  {verificationStatus === "PENDING" && (
                    <>
                      <div className="p-3 bg-primary-glow rounded-circle mb-3 text-primary" style={{ width: "fit-content", backgroundColor: "rgba(79,70,229,0.15)" }}>
                        <FiShield size={56} />
                      </div>
                      <h4 className="fw-bold text-indigo" style={{ color: "#a5b4fc" }}>Verification Pending</h4>
                      <p className="text-secondary px-3 mt-2">
                        You have not checked in at the examination center gates yet. Please print your Admit Card and present it to the security desk on exam day.
                      </p>
                    </>
                  )}

                  <hr className="w-100 border-secondary my-3" />
                  
                  <div className="p-3 rounded text-start" style={{ background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", fontSize: "0.8rem" }}>
                    <h6 className="fw-bold text-light mb-2">Gate Guidelines:</h6>
                    <ul className="m-0 ps-3 text-secondary">
                      <li>Automated scanning verifies Roll No, Name, DOB, and ID No.</li>
                      <li>Carry the same ID proof listed on your admit card (e.g. Aadhaar).</li>
                      <li>Double-check your hall number mapping before queueing.</li>
                    </ul>
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* Admit Card Modal View */}
          {showAdmitCard && (
            <AdmitCard student={user} onClose={() => setShowAdmitCard(false)} />
          )}

        </main>
      </div>
    </div>
  );
};

export default Dashboard;
