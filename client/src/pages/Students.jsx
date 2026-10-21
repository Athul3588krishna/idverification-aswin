/**
 * pages/Students.jsx
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   Admin candidate roster management interface.
 *   Enables searching, sorting, status-toggling, and deleting.
 *
 * KEY ACTIONS:
 *   • Lists users with 'student' role.
 *   • Supports real-time text searching (Name, Email, Roll Number).
 *   • Activates/Deactivates student entry permissions (block candidates).
 *   • Permanently removes student profiles.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiSearch,
  FiUserCheck,
  FiUserX,
  FiTrash2,
  FiInfo,
  FiClock,
  FiCheckCircle,
  FiUsers,
  FiFileText,
  FiZap,
  FiSend
} from "react-icons/fi";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";
import Loader from "../components/common/Loader";
import AdmitCard from "../components/AdmitCard";
import {
  getAllUsersAPI,
  updateUserStatusAPI,
  deleteUserAPI,
  approveAllStudentsAPI,
  getAutoApproveAPI,
  setAutoApproveAPI,
  notifyStudentTelegramAPI
} from "../api/authAPI";
import { io } from "socket.io-client";

const Students = () => {
  const serverBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api").replace(/\/api$/, "");
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialFilter = queryParams.get("filter") || "all";

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialFilter); // "all", "pending", "active"
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [autoApprove, setAutoApproveState] = useState(false);
  const [togglingAutoApprove, setTogglingAutoApprove] = useState(false);
  const [selectedStudentForCard, setSelectedStudentForCard] = useState(null);

  const fetchAutoApproveStatus = async () => {
    try {
      const data = await getAutoApproveAPI();
      if (data.success) {
        setAutoApproveState(data.autoApprove);
      }
    } catch (err) {
      console.error("Failed to load auto-approve setting", err);
    }
  };

  const handleToggleAutoApprove = async () => {
    try {
      setTogglingAutoApprove(true);
      const nextVal = !autoApprove;
      const data = await setAutoApproveAPI(nextVal);
      if (data.success) {
        setAutoApproveState(data.autoApprove);
        toast.success(data.message);
        fetchStudents();
      }
    } catch (err) {
      toast.error("Failed to update auto-approve setting");
    } finally {
      setTogglingAutoApprove(false);
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = {
        role: "student",
        search,
        page,
        limit: 10
      };

      if (statusFilter === "pending") {
        params.isActive = "false";
      } else if (statusFilter === "active") {
        params.isActive = "true";
      }

      const data = await getAllUsersAPI(params);
      if (data.success) {
        setStudents(data.users || []);
        setTotalPages(data.pages || 1);
        setTotalStudents(data.total || 0);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch student list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutoApproveStatus();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchStudents();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchStudents();
  }, [page]);

  // Listen for real-time student status updates via Socket.io
  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";
    const SOCKET_URL = API_BASE_URL.replace("/api", "");
    const socket = io(SOCKET_URL);

    socket.on("connect", () => {
      console.log("⚡ Real-time students channel active");
      socket.emit("join", "admin");
    });

    socket.on("student_status_updated", (data) => {
      if (data.allApproved || data.newStudent || data.autoApprove !== undefined) {
        fetchStudents();
      } else if (data.userId) {
        setStudents((prev) =>
          prev.map((student) =>
            student._id === data.userId ? { ...student, isActive: data.isActive } : student
          )
        );
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const nextStatus = !currentStatus;
      const data = await updateUserStatusAPI(id, nextStatus);
      if (data.success) {
        toast.success(data.message);
        setStudents((prev) =>
          prev.map((student) =>
            student._id === id ? { ...student, isActive: nextStatus } : student
          )
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update user status");
    }
  };

  const handleApproveAllPending = async () => {
    if (!window.confirm("Approve ALL pending student registrations right now in 1 click?")) {
      return;
    }

    try {
      const data = await approveAllStudentsAPI();
      if (data.success) {
        toast.success(data.message);
        fetchStudents();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve all candidates.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this student account?")) {
      return;
    }

    try {
      const data = await deleteUserAPI(id);
      if (data.success) {
        toast.success(data.message);
        setStudents((prev) => prev.filter((student) => student._id !== id));
        setTotalStudents((prev) => prev - 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete student account");
    }
  };

  const handleSendTelegram = async (student) => {
    try {
      const data = await notifyStudentTelegramAPI(student._id);
      if (data.success) {
        toast.success(`📱 ${data.message || "Telegram notification sent!"}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send Telegram notification");
    }
  };

  return (
    <div className="gradient-bg min-vh-100 d-flex flex-column">
      <Navbar />
      <div className="page-layout">
        <Sidebar />
        <main className="main-content container-fluid animate-fade-in-up">
          {/* Header Action bar */}
          <div className="row mb-4 align-items-center">
            <div className="col">
              <h2 className="mb-1" style={{ fontWeight: 700, fontFamily: "Space Grotesk, sans-serif" }}>
                Candidate Roster & Approvals
              </h2>
              <p className="text-secondary mb-0">Total: {totalStudents} candidates listed</p>
            </div>
            <div className="col-auto d-flex flex-wrap align-items-center gap-3">
              {/* Auto-Approve Toggle */}
              <div className="form-check form-switch d-flex align-items-center gap-2 p-2 rounded glass-card m-0" style={{ border: "1px solid var(--border-color)" }}>
                <input
                  className="form-check-input ms-0 cursor-pointer"
                  type="checkbox"
                  id="autoApproveSwitch"
                  checked={autoApprove}
                  onChange={handleToggleAutoApprove}
                  disabled={togglingAutoApprove}
                  style={{ width: "2.5em", height: "1.25em" }}
                />
                <label className="form-check-label text-light small fw-semibold cursor-pointer user-select-none mb-0" htmlFor="autoApproveSwitch">
                  <FiZap className={autoApprove ? "text-warning me-1" : "text-muted me-1"} size={16} />
                  Auto-Approve New Students: <strong className={autoApprove ? "text-success" : "text-secondary"}>{autoApprove ? "ON" : "OFF"}</strong>
                </label>
              </div>

              {/* Single Click Approve All Button */}
              <button
                className="btn btn-success d-flex align-items-center gap-2 fw-bold px-3 py-2"
                onClick={handleApproveAllPending}
                title="Approve all pending candidates at once"
              >
                <FiZap size={18} /> ⚡ Approve All Candidates (1-Click)
              </button>
            </div>
          </div>

          {/* Search Controls & Filter Tabs */}
          <div className="glass-card mb-4 p-3 d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="input-group" style={{ maxWidth: "400px" }}>
              <span className="input-group-text border-0" style={{ background: "rgba(255,255,255,0.04)", color: "var(--text-muted)" }}>
                <FiSearch size={18} />
              </span>
              <input
                type="text"
                className="form-control-custom border-0 w-75"
                placeholder="Search by name, email or roll number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Status Filter Buttons */}
            <div className="d-flex gap-2">
              <button
                className={`btn btn-sm ${statusFilter === "all" ? "btn-primary-custom" : "btn-outline-secondary"}`}
                style={statusFilter !== "all" ? { borderColor: "var(--border-color)", color: "var(--text-secondary)" } : {}}
                onClick={() => { setStatusFilter("all"); setPage(1); }}
              >
                <FiUsers className="me-1" size={14} /> All Candidates
              </button>
              <button
                className={`btn btn-sm ${statusFilter === "pending" ? "btn-warning text-dark fw-bold" : "btn-outline-warning"}`}
                onClick={() => { setStatusFilter("pending"); setPage(1); }}
              >
                <FiClock className="me-1" size={14} /> Pending Approval
              </button>
              <button
                className={`btn btn-sm ${statusFilter === "active" ? "btn-success" : "btn-outline-success"}`}
                onClick={() => { setStatusFilter("active"); setPage(1); }}
              >
                <FiCheckCircle className="me-1" size={14} /> Approved / Active
              </button>
            </div>
          </div>

          {/* List/Table Card */}
          <div className="glass-card overflow-hidden p-0 mb-5">
            {loading ? (
              <Loader message="Fetching candidates..." />
            ) : students.length === 0 ? (
              <div className="text-center py-5 text-secondary">
                <FiInfo size={32} className="mb-2" />
                <p className="mb-0">
                  {statusFilter === "pending"
                    ? "No pending student approvals at this time. All caught up!"
                    : "No registered students found matching criteria."}
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-custom m-0 align-middle">
                  <thead>
                    <tr>
                      <th>Candidate Name</th>
                      <th>Roll Number</th>
                      <th>Course</th>
                      <th>Sem</th>
                      <th>Allocated Venue & Seating</th>
                      <th>Approval Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student._id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {(() => {
                              const roll = (student.studentProfile?.rollNumber || "").toUpperCase();
                              const rawPhoto =
                                student.studentProfile?.photoUrl ||
                                student.photoUrl ||
                                (roll ? `/uploads/photo_${roll}.png` : null) ||
                                student.studentProfile?.idCardImageUrl;
                              const photoSrc = rawPhoto
                                ? (rawPhoto.startsWith("http") || rawPhoto.startsWith("data:")
                                    ? rawPhoto
                                    : `${serverBaseUrl}${rawPhoto.startsWith('/') ? '' : '/'}${rawPhoto}`)
                                : null;
                              return photoSrc ? (
                                <img
                                  src={photoSrc}
                                  alt={student.name}
                                  style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    border: "1px solid rgba(255,255,255,0.2)",
                                    flexShrink: 0
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "50%",
                                    background: "rgba(255,255,255,0.1)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "var(--text-muted)",
                                    fontSize: "0.8rem",
                                    fontWeight: "bold",
                                    flexShrink: 0
                                  }}
                                >
                                  {student.name?.charAt(0) || "S"}
                                </div>
                              );
                            })()}
                            <div>
                              <div className="fw-semibold text-light">{student.name}</div>
                              <small className="text-muted d-block">{student.email}</small>
                              {student.studentProfile?.telegramChatId ? (
                                <small className="text-info d-block" style={{ fontSize: "0.72rem" }}>
                                  📱 Telegram: <code>{student.studentProfile.telegramChatId}</code>
                                </small>
                              ) : (
                                <small className="text-muted d-block" style={{ fontSize: "0.72rem" }}>
                                  📱 Telegram: Not linked
                                </small>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge" style={{ background: "var(--primary-glow)", color: "var(--primary-light)", border: "1px solid var(--border-focus)" }}>
                            {student.studentProfile?.rollNumber || "N/A"}
                          </span>
                        </td>
                        <td>{student.studentProfile?.course || "N/A"}</td>
                        <td>Sem {student.studentProfile?.semester || "N/A"}</td>
                        <td className="text-wrap" style={{ maxWidth: "230px" }}>
                          {student.isActive && student.studentProfile?.allocatedHall ? (
                            <div>
                              <div className="fw-semibold text-light" style={{ fontSize: "0.85rem" }}>
                                {student.studentProfile?.allocatedHall}
                              </div>
                              <span className="badge bg-primary bg-opacity-25 text-primary border border-primary border-opacity-50 mt-1 me-1" style={{ fontSize: "0.75rem" }}>
                                {student.studentProfile?.allocatedSeat || "Desk Assigned"}
                              </span>
                              {student.studentProfile?.examDate && (
                                <small className="text-success d-block mt-1" style={{ fontSize: "0.72rem" }}>
                                  📅 {student.studentProfile.examDate} ({student.studentProfile.examTime || "10:00 AM"})
                                </small>
                              )}
                            </div>
                          ) : (
                            <div>
                              <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25" style={{ fontSize: "0.75rem" }}>
                                🔒 Date & Room Confidential
                              </span>
                              <small className="text-secondary d-block mt-1" style={{ fontSize: "0.7rem" }}>
                                Assigned & sent via Telegram upon approval
                              </small>
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={student.isActive ? "badge-success" : "badge-warning"}>
                            {student.isActive ? "APPROVED / ALLOCATED" : "PENDING APPROVAL"}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-2 align-items-center">
                            {/* Preview Admit Card */}
                            <button
                              onClick={() => setSelectedStudentForCard(student)}
                              className="btn btn-sm btn-outline-info"
                              style={{ padding: "0.3rem 0.5rem" }}
                              title="Preview Hall Ticket / Admit Card"
                            >
                              <FiFileText size={16} />
                            </button>

                            {/* Resend Telegram Notification (if approved) */}
                            {student.isActive && (
                              <button
                                onClick={() => handleSendTelegram(student)}
                                className="btn btn-sm btn-outline-primary"
                                style={{ padding: "0.3rem 0.5rem" }}
                                title="Send / Resend Telegram Exam Notification"
                              >
                                <FiSend size={15} />
                              </button>
                            )}

                            {/* Prominent Approve Button for Pending Candidates */}
                            {!student.isActive ? (
                              <button
                                onClick={() => handleToggleStatus(student._id, student.isActive)}
                                className="btn btn-sm btn-success d-inline-flex align-items-center gap-1 px-3 py-1 fw-bold"
                                title="Approve & Allocate Exam Hall & Desk (Notifies via Telegram)"
                              >
                                <FiUserCheck size={16} /> Approve & Allocate Seat
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleStatus(student._id, student.isActive)}
                                className="btn btn-sm btn-outline-warning"
                                style={{ padding: "0.3rem 0.5rem" }}
                                title="Revoke Approval / Block"
                              >
                                <FiUserX size={16} />
                              </button>
                            )}

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDelete(student._id)}
                              className="btn btn-sm btn-outline-danger"
                              style={{ padding: "0.3rem 0.5rem" }}
                              title="Delete Permanently"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center p-3 border-top" style={{ borderColor: "var(--border-color) !important" }}>
                <span className="text-secondary" style={{ fontSize: "0.85rem" }}>
                  Page {page} of {totalPages}
                </span>
                <div className="d-flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn btn-sm btn-outline-secondary"
                    style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="btn btn-sm btn-outline-secondary"
                    style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Candidate Admit Card / Hall Ticket Modal */}
      {selectedStudentForCard && (
        <AdmitCard
          student={selectedStudentForCard}
          onClose={() => setSelectedStudentForCard(null)}
        />
      )}
    </div>
  );
};

export default Students;
