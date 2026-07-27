/**
 * pages/VerificationHistory.jsx
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   Identity verification history audit trail.
 *   Provides a dashboard where admins and staff can search, filter,
 *   and audit past candidate entry logs.
 *
 * KEY FEATURES:
 *   • Paginated list view of all scans.
 *   • Filter by outcome status (All, Approved, Rejected).
 *   • Real-time searching by Roll Number, Name, or Operator.
 *   • Link to open/inspect the uploaded ID card image in a new tab.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FiArrowLeft,
  FiSearch,
  FiFilter,
  FiEye,
  FiClock,
  FiInfo,
  FiUser
} from "react-icons/fi";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";
import Loader from "../components/common/Loader";
import axiosInstance from "../api/axiosInstance";

const VerificationHistory = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // empty is "All"
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10
      };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const { data } = await axiosInstance.get("/verify/logs", { params });
      if (data.success) {
        setLogs(data.logs || []);
        setTotalPages(data.pages || 1);
        setTotalLogs(data.total || 0);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load verification logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1);
      fetchLogs();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
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
              onClick={() => navigate("/dashboard")}
              className="btn btn-outline-secondary p-2 d-flex align-items-center justify-content-center rounded-circle"
              style={{ width: "40px", height: "40px", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
              title="Dashboard"
            >
              <FiArrowLeft size={18} />
            </button>
            <div>
              <h2 className="mb-0" style={{ fontWeight: 700, fontFamily: "Space Grotesk, sans-serif" }}>
                Verification History
              </h2>
              <p className="text-secondary mb-0">Roster entry audit trail logs ({totalLogs} attempts)</p>
            </div>
          </div>

          {/* Filtering and Search control row */}
          <div className="row g-3 mb-4">
            {/* Search Input */}
            <div className="col-12 col-md-6 col-lg-4">
              <div className="input-group">
                <span className="input-group-text border-0" style={{ background: "rgba(255,255,255,0.04)", color: "var(--text-muted)" }}>
                  <FiSearch size={18} />
                </span>
                <input
                  type="text"
                  className="form-control-custom border-0 w-75"
                  placeholder="Search roll number, name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter buttons */}
            <div className="col-12 col-md-6 col-lg-8 d-flex align-items-center gap-2 justify-content-md-end">
              <span className="text-muted d-flex align-items-center gap-2 me-2" style={{ fontSize: "0.85rem" }}>
                <FiFilter size={16} /> Filter:
              </span>
              <button
                type="button"
                onClick={() => setStatusFilter("")}
                className={`btn btn-sm ${statusFilter === "" ? "btn-primary-custom" : "btn-outline-secondary"}`}
                style={statusFilter === "" ? {} : { borderColor: "var(--border-color)", color: "var(--text-primary)" }}
              >
                All Attempts
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("APPROVED")}
                className={`btn btn-sm ${statusFilter === "APPROVED" ? "btn-success" : "btn-outline-secondary"}`}
                style={statusFilter === "APPROVED" ? { backgroundColor: "var(--accent-green)", color: "#fff", border: "none" } : { borderColor: "var(--border-color)", color: "var(--text-primary)" }}
              >
                Approved
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("REJECTED")}
                className={`btn btn-sm ${statusFilter === "REJECTED" ? "btn-danger" : "btn-outline-secondary"}`}
                style={statusFilter === "REJECTED" ? { backgroundColor: "var(--accent-red)", color: "#fff", border: "none" } : { borderColor: "var(--border-color)", color: "var(--text-primary)" }}
              >
                Rejected
              </button>
            </div>
          </div>

          {/* Logs Table */}
          <div className="glass-card overflow-hidden p-0 mb-5">
            {loading ? (
              <Loader message="Loading logs history..." />
            ) : logs.length === 0 ? (
              <div className="text-center py-5 text-secondary">
                <FiInfo size={32} className="mb-2" />
                <p className="mb-0">No verification log history matches current query.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-custom m-0">
                  <thead>
                    <tr>
                      <th>Time Scan Passed</th>
                      <th>Candidate (OCR Extracted)</th>
                      <th>Match Roll No</th>
                      <th>Verification Status</th>
                      <th>Rejection Reason</th>
                      <th>Gate Agent Operator</th>
                      <th className="text-end">Proof Card</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log._id}>
                        <td>
                          <div className="d-flex align-items-center gap-2 text-light" style={{ fontSize: "0.85rem" }}>
                            <FiClock size={14} className="text-muted" />
                            {formatDate(log.createdAt)}
                          </div>
                        </td>
                        <td>
                          <div className="fw-semibold text-light">{log.scannedName || "Unknown"}</div>
                          <small className="text-muted text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "0.04em" }}>
                            Roll: {log.scannedRollNumber}
                          </small>
                        </td>
                        <td>
                          <span className="badge" style={{ background: "var(--primary-glow)", color: "var(--primary-light)", border: "1px solid var(--border-focus)" }}>
                            {log.matchedDetails?.rollNumber || "N/A"}
                          </span>
                        </td>
                        <td>
                          <span className={log.status === "APPROVED" ? "badge-success" : "badge-danger"}>
                            {log.status}
                          </span>
                        </td>
                        <td className="text-wrap" style={{ maxWidth: "200px" }}>
                          {log.status === "REJECTED" ? (
                            <span className="text-warning small d-inline-flex align-items-center gap-1">
                              {log.rejectionReason}
                            </span>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2" style={{ fontSize: "0.85rem" }}>
                            <FiUser size={14} className="text-muted" />
                            {log.verifiedBy?.name || "System"}
                          </div>
                        </td>
                        <td className="text-end">
                          {log.idCardPhotoPath ? (
                            <a
                              href={`http://localhost:5000${log.idCardPhotoPath}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-secondary p-2 d-inline-flex align-items-center justify-content-center"
                              style={{ borderColor: "var(--border-color)", color: "var(--text-primary)" }}
                              title="View Extracted ID image proof"
                            >
                              <FiEye size={14} />
                            </a>
                          ) : (
                            <span className="text-muted small">No Image</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paging */}
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

export default VerificationHistory;
