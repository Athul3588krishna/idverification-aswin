/**
 * pages/Home.jsx
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   Public Landing / Home Page for ExamShield.
 *   Provides a professional, production-ready introduction to the system:
 *   - Hero banner with system overview & portal login CTA.
 *   - Core feature highlight cards (OCR, Verification, Audit Trail).
 *   - 3-Step Verification Workflow guide.
 *   - Security & Compliance standards overview.
 *   - Professional footer.
 * ═══════════════════════════════════════════════════════════════
 */

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiShield,
  FiCpu,
  FiCheckCircle,
  FiLock,
  FiList,
  FiArrowRight,
  FiUserCheck,
  FiFileText,
  FiZap
} from "react-icons/fi";
import useAuth from "../hooks/useAuth";

const Home = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="gradient-bg min-vh-100 d-flex flex-column text-light">
      {/* ── Public Top Navigation Bar ── */}
      <nav className="navbar navbar-expand-lg border-bottom" style={{
        background: "rgba(15, 15, 21, 0.95)",
        borderColor: "var(--border-color) !important",
        height: "var(--header-height)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
        backdropFilter: "blur(10px)"
      }}>
        <div className="container px-4">
          <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
            <FiShield size={26} style={{ color: "var(--primary-light)" }} />
            <span style={{
              fontFamily: "Space Grotesk, sans-serif",
              fontWeight: 700,
              fontSize: "1.3rem",
              color: "var(--text-primary)",
              letterSpacing: "0.02em"
            }}>
              ExamShield
            </span>
          </Link>

          <div className="d-flex align-items-center gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary-custom d-flex align-items-center gap-2">
                Go to Dashboard <FiArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link to="/student/login" className="btn btn-outline-secondary d-flex align-items-center gap-2 text-white" style={{ borderColor: "var(--border-color)" }}>
                  Candidate Portal
                </Link>
                <Link to="/admin/login" className="btn btn-primary-custom d-flex align-items-center gap-2">
                  <FiLock size={16} /> Staff Portal
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="py-5 text-center my-auto">
        <div className="container px-4 py-4">
          <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-4" style={{
            background: "rgba(79, 70, 229, 0.15)",
            border: "1px solid rgba(79, 70, 229, 0.3)",
            color: "var(--primary-light)",
            fontSize: "0.85rem",
            fontWeight: 600
          }}>
            <FiZap size={14} /> Enterprise Examination Security System
          </div>

          <h1 className="display-4 fw-bold mb-3 mx-auto" style={{
            maxWidth: "900px",
            fontFamily: "Space Grotesk, sans-serif",
            lineHeight: 1.2
          }}>
            Automated OCR Identity Verification for Entrance Examinations
          </h1>

          <p className="lead text-secondary mb-5 mx-auto" style={{ maxWidth: "720px", fontSize: "1.15rem" }}>
            ExamShield prevents examination impersonation and fraud by instantly analyzing student ID cards with Tesseract OCR technology, cross-referencing candidate rosters in real-time.
          </p>

          <div className="d-flex flex-wrap justify-content-center gap-3 mb-5">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary-custom px-4 py-3 text-lg d-flex align-items-center gap-2">
                Open Security Dashboard <FiArrowRight size={18} />
              </Link>
            ) : (
              <>
                <Link to="/student/login" className="btn btn-primary-custom px-4 py-3 text-lg d-flex align-items-center gap-2">
                  <FiUserCheck size={18} /> Candidate Portal
                </Link>
                <Link to="/admin/login" className="btn btn-outline-secondary px-4 py-3 text-lg d-flex align-items-center gap-2" style={{
                  borderColor: "var(--border-color)",
                  color: "var(--text-primary)"
                }}>
                  <FiLock size={18} /> Staff / Admin Portal
                </Link>
              </>
            )}
            <a href="#how-it-works" className="btn btn-outline-secondary px-4 py-3 text-lg" style={{
              borderColor: "var(--border-color)",
              color: "var(--text-primary)"
            }}>
              How It Works
            </a>
          </div>

          {/* Key Metric Highlights */}
          <div className="row g-4 justify-content-center mt-2" style={{ maxWidth: "900px", margin: "0 auto" }}>
            <div className="col-12 col-md-4">
              <div className="p-3 rounded text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)" }}>
                <h3 className="fw-bold mb-0 text-primary-light" style={{ color: "var(--primary-light)" }}>Instant</h3>
                <small className="text-secondary">Tesseract OCR Extraction</small>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="p-3 rounded text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)" }}>
                <h3 className="fw-bold mb-0 text-success" style={{ color: "var(--accent-green)" }}>100%</h3>
                <small className="text-secondary">Verifiable Audit Trail</small>
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="p-3 rounded text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)" }}>
                <h3 className="fw-bold mb-0 text-light">Role-Based</h3>
                <small className="text-secondary">Admin & Security Control</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Key Features Section ── */}
      <section className="py-5 border-top" style={{ borderColor: "var(--border-color) !important" }}>
        <div className="container px-4">
          <div className="text-center mb-5">
            <h2 className="fw-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Core System Capabilities</h2>
            <p className="text-secondary">Engineered for high-throughput examination hall entry checkpoints</p>
          </div>

          <div className="row g-4">
            <div className="col-12 col-md-4">
              <div className="glass-card h-100 p-4">
                <div className="p-3 bg-primary-glow rounded-circle mb-3 d-inline-block" style={{ color: "var(--primary-light)" }}>
                  <FiCpu size={28} />
                </div>
                <h4 className="fw-bold mb-2">Automated OCR Engine</h4>
                <p className="text-secondary mb-0">
                  Leverages client/server Tesseract.js optical character recognition to read candidate names, roll numbers, and course codes directly from photos or camera frames.
                </p>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="glass-card h-100 p-4">
                <div className="p-3 rounded-circle mb-3 d-inline-block" style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--accent-green)" }}>
                  <FiUserCheck size={28} />
                </div>
                <h4 className="fw-bold mb-2">Registry Match Validation</h4>
                <p className="text-secondary mb-0">
                  Cross-references extracted candidate details against the verified student database, enforcing active status and venue assignment checks.
                </p>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div className="glass-card h-100 p-4">
                <div className="p-3 rounded-circle mb-3 d-inline-block" style={{ background: "rgba(59, 130, 246, 0.1)", color: "var(--accent-blue)" }}>
                  <FiList size={28} />
                </div>
                <h4 className="fw-bold mb-2">Tamper-Proof Audit Trail</h4>
                <p className="text-secondary mb-0">
                  Logs every entry check into MongoDB with verifier credentials, timestamp, match confidence, and high-resolution photo evidence for post-exam auditing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Workflow Guide ── */}
      <section id="how-it-works" className="py-5 border-top" style={{ borderColor: "var(--border-color) !important" }}>
        <div className="container px-4">
          <div className="text-center mb-5">
            <h2 className="fw-bold" style={{ fontFamily: "Space Grotesk, sans-serif" }}>Verification Workflow</h2>
            <p className="text-secondary">3 simple steps to secure exam hall entries</p>
          </div>

          <div className="row g-4 align-items-center">
            <div className="col-12 col-md-4 text-center">
              <div className="p-4 glass-card h-100">
                <div className="badge-success d-inline-block mb-3 px-3 py-1">STEP 1</div>
                <h5 className="fw-bold mb-2">Capture ID Card</h5>
                <p className="text-secondary small mb-0">Security staff uses a webcam or uploads an image of the candidate's hall ticket / ID card.</p>
              </div>
            </div>

            <div className="col-12 col-md-4 text-center">
              <div className="p-4 glass-card h-100">
                <div className="badge-success d-inline-block mb-3 px-3 py-1">STEP 2</div>
                <h5 className="fw-bold mb-2">OCR Text Extraction</h5>
                <p className="text-secondary small mb-0">Tesseract OCR extracts candidate roll numbers and identifies pattern matches automatically.</p>
              </div>
            </div>

            <div className="col-12 col-md-4 text-center">
              <div className="p-4 glass-card h-100">
                <div className="badge-success d-inline-block mb-3 px-3 py-1">STEP 3</div>
                <h5 className="fw-bold mb-2">Approve or Deny</h5>
                <p className="text-secondary small mb-0">System issues instant visual confirmation (Approved / Denied) and logs audit entry details.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-4 border-top mt-auto" style={{ borderColor: "var(--border-color) !important", background: "rgba(15, 15, 21, 0.98)" }}>
        <div className="container px-4 text-center text-secondary small">
          <div className="d-flex justify-content-center align-items-center gap-2 mb-2">
            <FiShield size={18} style={{ color: "var(--primary-light)" }} />
            <span className="fw-bold text-light">ExamShield System</span>
          </div>
          <p className="mb-0">&copy; {new Date().getFullYear()} ExamShield. OCR Identity Verification System. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
