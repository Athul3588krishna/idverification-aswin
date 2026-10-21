/**
 * components/AdmitCard.jsx
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   A beautiful, printable student Admit Card / Hall Ticket.
 *   Uses a clean print-friendly layout and CSS @media print queries.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useRef } from "react";
import { FiPrinter, FiX, FiShield, FiCheckCircle, FiUser, FiMapPin, FiClock, FiLock, FiAlertTriangle } from "react-icons/fi";
import { QRCodeSVG } from "qrcode.react";

const AdmitCard = ({ student, onClose }) => {
  const printRef = useRef();

  const handlePrint = () => {
    window.print();
  };

  if (!student) return null;

  const profile = student.studentProfile || {};
  const serverBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api").replace(/\/api$/, "");
  const roll = (profile.rollNumber || student.rollNumber || "").toUpperCase();

  // Prioritize student passport photo (profile.photoUrl), then pre-seeded sample photo, then uploaded card
  const photoPath =
    profile.photoUrl ||
    student.photoUrl ||
    profile.studentPhotoUrl ||
    student.studentPhotoUrl ||
    (roll ? `/uploads/photo_${roll}.png` : null) ||
    profile.idCardImageUrl ||
    student.idCardImageUrl;

  const photoUrl = photoPath
    ? (photoPath.startsWith("http://") || photoPath.startsWith("https://") || photoPath.startsWith("data:")
        ? photoPath
        : `${serverBaseUrl}${photoPath.startsWith("/") ? "" : "/"}${photoPath}`)
    : null;

  const isVerifiedByAdmin = Boolean(
    student.isActive &&
    profile.allocatedHall &&
    profile.allocatedSeat &&
    !profile.allocatedHall.includes("Pending")
  );

  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.85)", zIndex: 1050, overflowY: "auto" }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content border-0" style={{ background: "#1a1a2e", color: "#fff" }}>
          
          {/* Header Controls (Hidden on Print) */}
          <div className="modal-header border-secondary d-print-none justify-content-between">
            <h5 className="modal-title d-flex align-items-center gap-2 text-indigo">
              <FiShield /> Student Admit Card / Hall Ticket
            </h5>
            <div className="d-flex gap-2">
              <button className="btn btn-primary d-flex align-items-center gap-1" onClick={handlePrint}>
                <FiPrinter /> Print / Save PDF
              </button>
              <button className="btn btn-outline-light d-flex align-items-center gap-1" onClick={onClose}>
                <FiX /> Close
              </button>
            </div>
          </div>

          {/* Admit Card Printable Area */}
          <div className="modal-body p-4" ref={printRef} id="admit-card-print-area">
            <div className="admit-card-container p-4 border border-dark rounded bg-white text-dark position-relative">
              
              {/* Security Watermark for aesthetics */}
              <div className="watermark">
                {isVerifiedByAdmin ? "EXAMSHIELD SECURITY" : "PROVISIONAL - PENDING VERIFICATION"}
              </div>

              {/* Card Header */}
              <div className="d-flex align-items-center justify-content-between border-bottom border-dark pb-3 mb-4 admit-card-header">
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-dark text-white p-2 rounded admit-card-logo">
                    <FiShield size={28} />
                  </div>
                  <div>
                    <h4 className="fw-bold m-0 text-uppercase tracking-wider admit-card-title">State University of Technology</h4>
                    <small className="text-muted fw-bold admit-card-subtitle">
                      {isVerifiedByAdmin ? "OFFICIAL ENTRANCE EXAMINATION ADMIT CARD" : "PROVISIONAL EXAMINATION PASS (AWAITING ADMIN APPROVAL)"}
                    </small>
                  </div>
                </div>
                <div className="text-end border border-dark px-2 py-1 rounded bg-light">
                  <small className="fw-bold d-block text-muted">ACADEMIC YEAR</small>
                  <span className="fw-bold">2026 - 2027</span>
                </div>
              </div>

              {/* Main Body Grid */}
              <div className="row g-4">
                {/* Text Details (Left Side) */}
                <div className="col-8">
                  <table className="table table-sm table-borderless m-0 info-table">
                    <tbody>
                      <tr>
                        <td className="fw-bold text-muted text-uppercase py-1" style={{ width: "35%" }}>Name of Candidate</td>
                        <td className="fw-bold py-1 text-uppercase">: {student.name}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold text-muted text-uppercase py-1">Registration / Roll No</td>
                        <td className="fw-bold py-1 text-primary text-uppercase">: {profile.rollNumber || "N/A"}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold text-muted text-uppercase py-1">Phone Number</td>
                        <td className="fw-bold py-1">: {student.phone || profile.phone || "N/A"}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold text-muted text-uppercase py-1">Course / Stream</td>
                        <td className="fw-bold py-1 text-uppercase">: {profile.course || "N/A"} (Semester {profile.semester || 1})</td>
                      </tr>
                      <tr>
                        <td className="fw-bold text-muted text-uppercase py-1">Date of Birth (DOB)</td>
                        <td className="fw-bold py-1">: {profile.dob || "N/A"}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold text-muted text-uppercase py-1">Government ID No</td>
                        <td className="fw-bold py-1">: {profile.idNumber || "N/A"}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold text-muted text-uppercase py-1">Telegram Chat ID</td>
                        <td className="fw-bold py-1">: {profile.telegramChatId ? `📱 ${profile.telegramChatId}` : "Not Linked"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Photo & Barcode (Right Side) */}
                <div className="col-4 d-flex flex-column align-items-center justify-content-start border-start border-light ps-4 admit-card-sidebar">
                  {/* Photo Frame */}
                  <div
                    className="photo-frame mb-3 d-flex align-items-center justify-content-center border border-dark overflow-hidden position-relative rounded-1"
                    style={{
                      width: "125px",
                      height: "150px",
                      backgroundColor: "#f8f9fa",
                      boxShadow: "inset 0 0 4px rgba(0,0,0,0.15)"
                    }}
                  >
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={student.name || "Candidate Photo"}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block"
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          const fallback = e.currentTarget.parentElement.querySelector(".photo-fallback");
                          if (fallback) fallback.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className="photo-fallback flex-column align-items-center justify-content-center text-muted text-center p-2"
                      style={{
                        display: photoUrl ? "none" : "flex",
                        height: "100%",
                        width: "100%",
                        fontSize: "0.75rem",
                        fontWeight: "600"
                      }}
                    >
                      <FiUser size={28} className="mb-1 text-secondary opacity-50" />
                      <span>PASSPORT PHOTO</span>
                    </div>
                  </div>
                  {/* Authentic Security QR Code */}
                  <div className="barcode-simulation text-center py-2 px-2 border border-dark bg-light rounded w-100 d-flex flex-column align-items-center justify-content-center">
                    <QRCodeSVG
                      value={profile.qrToken || `EXAM-${profile.rollNumber || "MCA26001"}-2026`}
                      size={84}
                      level="M"
                    />
                    <small className="fw-bold text-uppercase mt-1" style={{ fontSize: "0.65rem", letterSpacing: "0.1em" }}>
                      {profile.qrToken || `EXAM-${profile.rollNumber || "MCA26001"}-2026`}
                    </small>
                    <small className="text-muted text-uppercase" style={{ fontSize: "0.55rem" }}>
                      {isVerifiedByAdmin ? "Scan for Fast Gate Entry" : "Verification Incomplete"}
                    </small>
                  </div>
                </div>
              </div>

              {/* Exam Schedule, Hall & Seat Details */}
              <div className="border border-dark rounded p-3 my-4 bg-light admit-card-schedule">
                <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-1 mb-3 schedule-header">
                  <h5 className="fw-bold m-0 text-uppercase" style={{ fontSize: "0.95rem" }}>Examination Schedule & Seating Allocation</h5>
                  {profile.checkInStatus === "CHECKED_IN" ? (
                    <span className="badge bg-success text-uppercase px-2 py-1" style={{ fontSize: "0.7rem" }}>
                      <FiCheckCircle className="me-1" /> ✓ Gate Admitted (Checked In)
                    </span>
                  ) : isVerifiedByAdmin ? (
                    <span className="badge bg-primary text-uppercase px-2 py-1" style={{ fontSize: "0.7rem" }}>
                      <FiCheckCircle className="me-1" /> ✓ Verified by Admin — Seat Allocated
                    </span>
                  ) : (
                    <span className="badge bg-warning text-dark text-uppercase px-2 py-1" style={{ fontSize: "0.7rem" }}>
                      <FiLock className="me-1" /> Pending Admin Verification & Seating
                    </span>
                  )}
                </div>
                <div className="row g-2">
                  <div className="col-md-5 mb-2">
                    <small className="text-muted d-block fw-bold">SUBJECT</small>
                    <span className="fw-bold text-uppercase">{profile.examSubject || "Entrance Examination 2026"}</span>
                  </div>
                  <div className="col-md-3 mb-2">
                    <small className="text-muted d-block fw-bold">DATE & TIME</small>
                    {isVerifiedByAdmin && profile.examDate ? (
                      <>
                        <span className="fw-bold text-success">{profile.examDate}</span>
                        <small className="d-block text-muted">{profile.examTime || "10:00 AM - 1:00 PM"}</small>
                      </>
                    ) : (
                      <div>
                        <span className="text-warning fw-bold d-flex align-items-center gap-1" style={{ fontSize: "0.82rem" }}>
                          <FiLock size={12} /> Confidential
                        </span>
                        <small className="text-muted d-block" style={{ fontSize: "0.68rem" }}>
                          Notified via Telegram upon approval
                        </small>
                      </div>
                    )}
                  </div>
                  <div className="col-md-4 mb-2">
                    <small className="text-muted d-block fw-bold">EXAM CENTER VENUE</small>
                    {isVerifiedByAdmin ? (
                      <span className="fw-bold text-uppercase text-dark">{profile.examCenter || "State University Examination Complex"}</span>
                    ) : (
                      <div>
                        <span className="text-warning fw-bold d-flex align-items-center gap-1" style={{ fontSize: "0.85rem" }}>
                          <FiClock size={14} /> Pending Admin Verification
                        </span>
                        <small className="text-muted d-block" style={{ fontSize: "0.7rem" }}>Zone: {profile.examCenter || "Main University Campus"}</small>
                      </div>
                    )}
                  </div>
                  
                  {/* Real-World Seating Allocation Card */}
                  {isVerifiedByAdmin ? (
                    <div className="col-12 mt-2 pt-2 border-top border-secondary-subtle">
                      <div className="d-flex align-items-center justify-content-between bg-white p-3 rounded border border-success shadow-sm seating-box">
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <span className="badge bg-success" style={{ fontSize: "0.65rem" }}>✓ ALLOCATED POST-VERIFICATION</span>
                            <small className="text-muted fw-bold text-uppercase" style={{ fontSize: "0.65rem" }}>Official Examination Hall & Room</small>
                          </div>
                          <span className="fw-bold text-primary fs-5">{profile.allocatedHall}</span>
                        </div>
                        <div className="text-end">
                          <small className="text-muted fw-bold d-block text-uppercase mb-1" style={{ fontSize: "0.65rem" }}>Assigned Desk Number</small>
                          <span className="badge bg-primary fs-6 px-3 py-2 shadow-sm">{profile.allocatedSeat}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="col-12 mt-2 pt-2 border-top border-secondary-subtle">
                      <div className="p-3 rounded border border-warning seating-box" style={{ backgroundColor: "#fffbeb" }}>
                        <div className="d-flex align-items-center justify-content-between mb-2 pb-1 border-bottom border-warning-subtle">
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge bg-warning text-dark fw-bold d-flex align-items-center gap-1">
                              <FiLock size={12} /> CONFIDENTIAL SEATING
                            </span>
                            <small className="fw-bold text-uppercase text-secondary" style={{ fontSize: "0.7rem" }}>Anti-Malpractice Protocol</small>
                          </div>
                          <span className="badge bg-secondary text-white" style={{ fontSize: "0.65rem" }}>Status: Awaiting Admin Approval</span>
                        </div>
                        <div className="row g-2 align-items-center">
                          <div className="col-md-7">
                            <small className="text-muted fw-bold d-block text-uppercase" style={{ fontSize: "0.65rem" }}>Assigned Examination Hall (Room Number)</small>
                            <span className="text-danger fw-bold d-flex align-items-center gap-1" style={{ fontSize: "0.85rem" }}>
                              <FiLock size={14} /> Locked — Room will be updated after Admin verification
                            </span>
                          </div>
                          <div className="col-md-5 text-md-end">
                            <small className="text-muted fw-bold d-block text-uppercase" style={{ fontSize: "0.65rem" }}>Assigned Desk Number</small>
                            <span className="badge bg-secondary text-light px-3 py-1" style={{ fontSize: "0.8rem" }}>🔒 Pending Approval</span>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-top border-warning-subtle text-muted security-disclaimer" style={{ fontSize: "0.72rem", lineHeight: "1.4" }}>
                          ℹ️ <strong>Security Protocol:</strong> In accordance with university examination guidelines, specific examination room numbers and desk allocations are kept confidential prior to official verification. They will automatically unlock and update here once an Administrator approves your candidate credentials.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Signatures & Instructions */}
              <div className="row mt-4 pt-4 border-top border-light align-items-end admit-card-footer">
                <div className="col-6">
                  <h6 className="fw-bold m-0" style={{ fontSize: "0.85rem" }}>Instructions for Candidate:</h6>
                  <ul className="m-0 ps-3 text-muted instructions-list" style={{ fontSize: "0.75rem", lineHeight: "1.3" }}>
                    <li>Carry this Admit Card along with a valid Government photo ID.</li>
                    <li>Report to the exam center 45 minutes prior to start time.</li>
                    <li>Identity verification will be done via automated OCR scanners.</li>
                  </ul>
                </div>
                <div className="col-3 text-center">
                  <div className="signature-line mx-auto border-bottom border-dark w-75 mb-1" style={{ height: "40px" }}></div>
                  <small className="fw-bold text-muted text-uppercase" style={{ fontSize: "0.7rem" }}>Candidate's Sign</small>
                </div>
                <div className="col-3 text-center">
                  <div className="signature-line mx-auto border-bottom border-dark w-75 mb-1" style={{ height: "40px" }}>
                    {/* Simulated digital signature text */}
                    <span className="fst-italic text-indigo fw-bold" style={{ fontSize: "0.85rem" }}>ExamShield</span>
                  </div>
                  <small className="fw-bold text-muted text-uppercase" style={{ fontSize: "0.7rem" }}>Controller of Exam</small>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Styled css overrides specifically for print mode and look */}
      <style>{`
        .modal {
          background-color: rgba(0,0,0,0.8);
        }
        .admit-card-container {
          box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          font-family: 'Outfit', 'Inter', sans-serif;
        }
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-25deg);
          font-size: 3.5rem;
          font-weight: 900;
          color: rgba(0,0,0,0.035);
          white-space: nowrap;
          pointer-events: none;
          letter-spacing: 0.15em;
          user-select: none;
        }
        .info-table td {
          font-size: 0.95rem;
        }
        
        /* ══════════════════════════════════════════════════════
           PRINT MEDIA QUERY — GUARANTEED EXACT SINGLE PAGE A4
           ══════════════════════════════════════════════════════ */
        @media print {
          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
          }

          body {
            background: #fff !important;
            color: #000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Hide all application chrome, dashboards, modals, backdrop */
          body * {
            visibility: hidden;
          }

          /* Show only the admit card area and its children */
          #admit-card-print-area,
          #admit-card-print-area * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .modal {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: transparent !important;
            background-color: transparent !important;
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            z-index: 99999 !important;
          }

          .modal-dialog {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            transform: none !important;
          }

          .modal-content {
            background: transparent !important;
            background-color: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }

          #admit-card-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            color: #000 !important;
          }

          .admit-card-container {
            width: 100% !important;
            max-width: 100% !important;
            border: 1.5px solid #000 !important;
            box-shadow: none !important;
            background: #fff !important;
            color: #000 !important;
            padding: 12px 16px !important;
            margin: 0 !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          .watermark {
            font-size: 2.8rem !important;
            color: rgba(0,0,0,0.04) !important;
          }

          /* Header */
          .admit-card-header {
            margin-bottom: 8px !important;
            padding-bottom: 6px !important;
            border-bottom: 1.5px solid #000 !important;
          }
          .admit-card-title {
            font-size: 1.15rem !important;
            letter-spacing: 0.05em !important;
          }
          .admit-card-subtitle {
            font-size: 0.72rem !important;
          }
          .admit-card-logo {
            padding: 4px 6px !important;
          }
          .admit-card-logo svg {
            width: 22px !important;
            height: 22px !important;
          }
          .admit-card-year {
            padding: 2px 8px !important;
          }
          .admit-card-year span {
            font-size: 0.85rem !important;
          }

          /* Candidate Info Table */
          .info-table td {
            font-size: 0.82rem !important;
            padding-top: 2px !important;
            padding-bottom: 2px !important;
            line-height: 1.25 !important;
          }

          /* Sidebar: Passport Photo & QR Code */
          .admit-card-sidebar {
            padding-left: 12px !important;
          }
          .photo-frame {
            width: 105px !important;
            height: 125px !important;
            margin-bottom: 5px !important;
            border: 1.5px solid #000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .photo-frame img {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            display: block !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .barcode-simulation {
            width: 105px !important;
            padding: 3px 2px !important;
            border: 1px solid #333 !important;
            background: #f8f9fa !important;
          }
          .barcode-simulation svg {
            width: 58px !important;
            height: 58px !important;
          }
          .barcode-simulation small {
            font-size: 0.58rem !important;
            line-height: 1.1 !important;
          }

          /* Schedule & Seating Section */
          .admit-card-schedule {
            margin-top: 6px !important;
            margin-bottom: 6px !important;
            padding: 6px 10px !important;
            border: 1.5px solid #333 !important;
            background: #f8f9fa !important;
          }
          .schedule-header {
            margin-bottom: 4px !important;
            padding-bottom: 3px !important;
          }
          .schedule-header h5 {
            font-size: 0.82rem !important;
          }
          .admit-card-schedule small {
            font-size: 0.65rem !important;
          }
          .admit-card-schedule span {
            font-size: 0.82rem !important;
          }
          .seating-box {
            padding: 6px 10px !important;
          }
          .seating-box span.fs-5 {
            font-size: 0.95rem !important;
          }
          .seating-box span.fs-6 {
            font-size: 0.85rem !important;
            padding: 4px 8px !important;
          }
          .security-disclaimer {
            display: none !important;
          }

          /* Footer: Candidate Instructions & Signatures */
          .admit-card-footer {
            margin-top: 8px !important;
            padding-top: 6px !important;
            border-top: 1.5px solid #000 !important;
          }
          .admit-card-footer h6 {
            font-size: 0.78rem !important;
            margin-bottom: 2px !important;
          }
          .instructions-list {
            font-size: 0.68rem !important;
            line-height: 1.2 !important;
            padding-left: 14px !important;
          }
          .signature-line {
            height: 24px !important;
            border-bottom: 1.5px solid #000 !important;
            margin-bottom: 2px !important;
          }
          .signature-line span {
            font-size: 0.8rem !important;
          }
          .admit-card-footer small {
            font-size: 0.65rem !important;
          }

          /* Controls to completely hide when printing */
          .d-print-none {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdmitCard;
