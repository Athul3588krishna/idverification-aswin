/**
 * components/AdmitCard.jsx
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   A beautiful, printable student Admit Card / Hall Ticket.
 *   Uses a clean print-friendly layout and CSS @media print queries.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useRef } from "react";
import { FiPrinter, FiX, FiShield, FiCheckCircle, FiUser, FiMapPin, FiClock } from "react-icons/fi";
import { QRCodeSVG } from "qrcode.react";

const AdmitCard = ({ student, onClose }) => {
  const printRef = useRef();

  const handlePrint = () => {
    window.print();
  };

  if (!student) return null;

  const profile = student.studentProfile || {};
  const serverBaseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api").replace(/\/api$/, "");
  const photoPath = profile.idCardImageUrl || student.idCardImageUrl;
  const photoUrl = photoPath
    ? (photoPath.startsWith("http://") || photoPath.startsWith("https://") || photoPath.startsWith("data:")
        ? photoPath
        : `${serverBaseUrl}${photoPath.startsWith("/") ? "" : "/"}${photoPath}`)
    : null;

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
              <div className="watermark">EXAMSHIELD SECURITY</div>

              {/* Card Header */}
              <div className="d-flex align-items-center justify-content-between border-bottom border-dark pb-3 mb-4">
                <div className="d-flex align-items-center gap-2">
                  <div className="bg-dark text-white p-2 rounded">
                    <FiShield size={28} />
                  </div>
                  <div>
                    <h4 className="fw-bold m-0 text-uppercase tracking-wider">State University of Technology</h4>
                    <small className="text-muted fw-bold">OFFICIAL ENTRANCE EXAMINATION ADMIT CARD</small>
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
                    </tbody>
                  </table>
                </div>

                {/* Photo & Barcode (Right Side) */}
                <div className="col-4 d-flex flex-column align-items-center justify-content-start border-start border-light ps-4">
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
                    <small className="text-muted text-uppercase" style={{ fontSize: "0.55rem" }}>Scan for Fast Gate Entry</small>
                  </div>
                </div>
              </div>

              {/* Exam Schedule, Hall & Seat Details */}
              <div className="border border-dark rounded p-3 my-4 bg-light">
                <div className="d-flex justify-content-between align-items-center border-bottom border-secondary pb-1 mb-3">
                  <h5 className="fw-bold m-0 text-uppercase" style={{ fontSize: "0.95rem" }}>Examination Schedule & Seating Allocation</h5>
                  <span className={`badge ${profile.checkInStatus === "CHECKED_IN" ? "bg-success" : "bg-warning text-dark"} text-uppercase px-2 py-1`} style={{ fontSize: "0.7rem" }}>
                    {profile.checkInStatus === "CHECKED_IN" ? "✓ Gate Admitted (Checked In)" : "Pending Gate Verification"}
                  </span>
                </div>
                <div className="row g-2">
                  <div className="col-md-5 mb-2">
                    <small className="text-muted d-block fw-bold">SUBJECT</small>
                    <span className="fw-bold text-uppercase">{profile.examSubject || "Entrance Examination 2026"}</span>
                  </div>
                  <div className="col-md-3 mb-2">
                    <small className="text-muted d-block fw-bold">DATE & TIME</small>
                    <span className="fw-bold">{profile.examDate || "2026-08-10"}</span>
                    <small className="d-block text-muted">{profile.examTime || "10:00 AM - 1:00 PM"}</small>
                  </div>
                  <div className="col-md-4 mb-2">
                    <small className="text-muted d-block fw-bold">EXAM CENTER</small>
                    <span className="fw-bold text-uppercase">{profile.examCenter || "Main Campus Hall"}</span>
                  </div>
                  
                  {/* Real-World Seating Allocation Card */}
                  <div className="col-12 mt-2 pt-2 border-top border-secondary-subtle">
                    <div className="d-flex align-items-center justify-content-between bg-white p-2 rounded border border-dark">
                      <div>
                        <small className="text-muted fw-bold d-block text-uppercase" style={{ fontSize: "0.65rem" }}>Assigned Examination Hall</small>
                        <span className="fw-bold text-primary fs-6">{profile.allocatedHall || "Block B - Room 204"}</span>
                      </div>
                      <div className="text-end">
                        <small className="text-muted fw-bold d-block text-uppercase" style={{ fontSize: "0.65rem" }}>Assigned Desk Number</small>
                        <span className="badge bg-primary fs-6 px-3 py-1">{profile.allocatedSeat || "Desk #18"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Signatures & Instructions */}
              <div className="row mt-4 pt-4 border-top border-light align-items-end">
                <div className="col-6">
                  <h6 className="fw-bold m-0" style={{ fontSize: "0.85rem" }}>Instructions for Candidate:</h6>
                  <ul className="m-0 ps-3 text-muted" style={{ fontSize: "0.75rem", lineHeight: "1.3" }}>
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
        
        /* Print media query override */
        @media print {
          @page {
            size: auto;
            margin: 10mm;
          }
          body * {
            visibility: hidden !important;
          }
          #admit-card-print-area, #admit-card-print-area * {
            visibility: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #admit-card-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #fff !important;
            color: #000 !important;
          }
          .modal {
            position: absolute !important;
            background: none !important;
            overflow: visible !important;
          }
          .modal-dialog {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .modal-content {
            background: none !important;
            border: 0 !important;
          }
          .admit-card-container {
            border: 1.5px solid #000 !important;
            box-shadow: none !important;
            padding: 1.2cm !important;
          }
          .photo-frame {
            border: 1px solid #000 !important;
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
          .d-print-none {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdmitCard;
