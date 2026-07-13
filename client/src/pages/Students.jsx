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
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiPlus,
  FiSearch,
  FiUserCheck,
  FiUserX,
  FiTrash2,
  FiInfo
} from "react-icons/fi";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";
import Loader from "../components/common/Loader";
import { getAllUsersAPI, updateUserStatusAPI, deleteUserAPI } from "../api/authAPI";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await getAllUsersAPI({
        role: "student",
        search,
        page,
        limit: 10
      });
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
    // Debounce search input to avoid hitting database on every keystroke
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchStudents();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  useEffect(() => {
    fetchStudents();
  }, [page]);

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

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this student account?")) {
      return;
    }

    try {
      const data = await deleteUserAPI(id);
      if (data.success) {
        toast.success(data.message);
        // Refresh list or remove item locally
        setStudents((prev) => prev.filter((student) => student._id !== id));
        setTotalStudents((prev) => prev - 1);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete student account");
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
                Candidate Roster
              </h2>
              <p className="text-secondary mb-0">Total: {totalStudents} registered students</p>
            </div>
            <div className="col-auto">
              <Link to="/students/add" className="btn btn-primary-custom d-flex align-items-center gap-2">
                <FiPlus size={16} /> Register Student
              </Link>
            </div>
          </div>

          {/* Search Controls */}
          <div className="glass-card mb-4 p-3">
            <div className="input-group" style={{ maxWidth: "450px" }}>
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
          </div>

          {/* List/Table Card */}
          <div className="glass-card overflow-hidden p-0 mb-5">
            {loading ? (
              <Loader message="Fetching candidates..." />
            ) : students.length === 0 ? (
              <div className="text-center py-5 text-secondary">
                <FiInfo size={32} className="mb-2" />
                <p className="mb-0">No registered students found.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-custom m-0">
                  <thead>
                    <tr>
                      <th>Candidate Name</th>
                      <th>Roll Number</th>
                      <th>Course</th>
                      <th>Sem</th>
                      <th>Exam Center Venue</th>
                      <th>Entry Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student._id}>
                        <td>
                          <div className="fw-semibold text-light">{student.name}</div>
                          <small className="text-muted d-block">{student.email}</small>
                        </td>
                        <td>
                          <span className="badge" style={{ background: "var(--primary-glow)", color: "var(--primary-light)", border: "1px solid var(--border-focus)" }}>
                            {student.studentProfile?.rollNumber || "N/A"}
                          </span>
                        </td>
                        <td>{student.studentProfile?.course || "N/A"}</td>
                        <td>Sem {student.studentProfile?.semester || "N/A"}</td>
                        <td className="text-wrap" style={{ maxWidth: "200px" }}>{student.studentProfile?.examCenter || "N/A"}</td>
                        <td>
                          <span className={student.isActive ? "badge-success" : "badge-danger"}>
                            {student.isActive ? "ACTIVE / ELIGIBLE" : "SUSPENDED"}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-2">
                            {/* Toggle Access Status */}
                            <button
                              onClick={() => handleToggleStatus(student._id, student.isActive)}
                              className={`btn btn-sm ${student.isActive ? "btn-outline-warning" : "btn-outline-success"}`}
                              style={{ padding: "0.3rem 0.5rem" }}
                              title={student.isActive ? "Block Access" : "Unblock Access"}
                            >
                              {student.isActive ? <FiUserX size={16} /> : <FiUserCheck size={16} />}
                            </button>

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
    </div>
  );
};

export default Students;
