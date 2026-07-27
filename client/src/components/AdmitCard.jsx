/**
 * components/AdmitCard.jsx
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   A beautiful, printable student Admit Card / Hall Ticket.
 *   Uses a clean print-friendly layout and CSS @media print queries.
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useRef } from "react";
import { FiPrinter, FiX, FiShield, FiCheckCircle } from "react-icons/fi";

const AdmitCard = ({ student, onClose }) => {
  const printRef = useRef();

  const handlePrint = () => {
    window.print();
  };

  if (!student) return null;

  const profile = student.studentProfile || {};

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
                  <div className="photo-frame mb-3 d-flex align-items-center justify-content-center text-muted fw-bold border border-dark" style={{ width: "120px", height: "140px", backgroundColor: "#f8f9fa" }}>
                    PASSPORT PHOTO
                  </div>
                  {/* Simulated barcode */}
                  <div className="barcode-simulation text-center py-2 px-3 border border-dark bg-light rounded w-100">
                    <div className="barcode-lines mb-1" style={{ height: "30px", background: "repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 8px)" }}></div>
                    <small className="fw-bold text-uppercase" style={{ fontSize: "0.7rem", letterSpacing: "0.2em" }}>{profile.rollNumber || "MCA26002"}</small>
                  </div>
                </div>
              </div>

              {/* Exam Schedule details */}
              <div className="border border-dark rounded p-3 my-4 bg-light">
                <h5 className="fw-bold mb-3 text-uppercase border-bottom border-secondary pb-1" style={{ fontSize: "0.95rem" }}>Examination Schedule & Venue</h5>
                <div className="row">
                  <div className="col-md-6 mb-2">
                    <small className="text-muted d-block fw-bold">SUBJECT</small>
                    <span className="fw-bold text-uppercase">{profile.examSubject || "Entrance Examination 2026"}</span>
                  </div>
                  <div className="col-md-3 mb-2">
                    <small className="text-muted d-block fw-bold">DATE & TIME</small>
                    <span className="fw-bold">{profile.examDate || "2026-08-10"}</span>
                    <small className="d-block text-muted">{profile.examTime || "10:00 AM - 1:00 PM"}</small>
                  </div>
                  <div className="col-md-3 mb-2">
                    <small className="text-muted d-block fw-bold">VENUE / EXAM CENTER</small>
                    <span className="fw-bold text-uppercase">{profile.examCenter || "Hall A - Room 102"}</span>
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
          body * {
            visibility: hidden;
          }
          #admit-card-print-area, #admit-card-print-area * {
            visibility: visible;
          }
          #admit-card-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            margin: 0 !important;
            background: #fff !important;
            color: #000 !important;
          }
          .modal {
            position: absolute;
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
            border: 1px solid #000 !important;
            box-shadow: none !important;
            padding: 1.5cm !important;
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
