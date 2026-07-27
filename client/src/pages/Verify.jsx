/**
 * pages/Verify.jsx
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   The core identity scanner page of ExamShield.
 *   Allows Security Staff to capture an ID card from a webcam
 *   or drag & drop/upload an image file.
 *
 * KEY FEATURES:
 *   • Live Webcam Stream: Uses browser WebRTC API to stream camera
 *     and capture a snapshot locally via Canvas.
 *   • File Drag-and-Drop / Upload support.
 *   • Real-time scan result panels: green styling for Approved,
 *     red styling for Rejected (with reasons: suspended, not in CSV).
 * ═══════════════════════════════════════════════════════════════
 */

import React, { useState, useRef, useEffect } from "react";
import { toast } from "react-toastify";
import {
  FiCpu,
  FiUploadCloud,
  FiCamera,
  FiCheckCircle,
  FiXCircle,
  FiArrowLeft,
  FiUser,
  FiFileText,
  FiMapPin,
  FiAlertTriangle
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";
import Loader from "../components/common/Loader";
import axiosInstance from "../api/axiosInstance";

const Verify = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);

  // Camera capture states
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // ── Cleanup Camera Stream on Unmount ──
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // ── Camera Operations ──
  const startCamera = async () => {
    setResult(null);
    setFile(null);
    setPreview(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 640, height: 480 }
      });
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      toast.error("Unable to access system webcam. Please upload file instead.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const captureSnapshot = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      const capturedFile = new File([blob], "snapshot.jpg", { type: "image/jpeg" });
      setFile(capturedFile);
      setPreview(URL.createObjectURL(capturedFile));
      stopCamera();
    }, "image/jpeg");
  };

  // ── Upload/Drop Event Handlers ──
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      stopCamera();
      setResult(null);
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const selectedFile = e.dataTransfer.files[0];
    if (selectedFile) {
      stopCamera();
      setResult(null);
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  // ── Trigger API Scanner Request ──
  const handleVerify = async () => {
    if (!file) {
      toast.warn("Please select or capture a card image first");
      return;
    }

    setScanning(true);
    setResult(null);

    const formData = new FormData();
    formData.append("idCard", file);

    try {
      // 30 seconds timeout allowed in axios instance
      const { data } = await axiosInstance.post("/verify/scan", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      if (data.success) {
        setResult(data.result);
        if (data.result.status === "APPROVED") {
          toast.success("Verification Success! Entry Approved. ✅");
        } else {
          toast.error(`Verification Failed: ${data.result.rejectionReason} ❌`);
        }
      }
    } catch (err) {
      const message = err.response?.data?.message || "Verification request failed. Check file resolution.";
      toast.error(message);
    } finally {
      setScanning(false);
    }
  };

  const resetScanner = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    stopCamera();
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
                Identity Scanner
              </h2>
              <p className="text-secondary mb-0">OCR verification of candidate admission credentials</p>
            </div>
          </div>

          <div className="row g-4 mb-5">
            {/* Input Capture Zone */}
            <div className="col-12 col-lg-6">
              <div className="glass-card h-100">
                <h4 className="mb-3 d-flex align-items-center gap-2">
                  <FiCpu size={20} className="text-primary-light" />
                  1. Capture/Upload ID Image
                </h4>

                {/* Live Webcam Canvas Area */}
                {cameraActive ? (
                  <div className="camera-box position-relative rounded overflow-hidden mb-3 border border-secondary" style={{ height: "300px" }}>
                    <video ref={videoRef} autoPlay playsInline className="w-100 h-100 object-fit-cover" />
                    <div className="position-absolute bottom-0 start-50 translate-middle-x mb-3 d-flex gap-2">
                      <button type="button" onClick={captureSnapshot} className="btn btn-success d-flex align-items-center gap-2">
                        <FiCamera size={16} /> Snap Photo
                      </button>
                      <button type="button" onClick={stopCamera} className="btn btn-danger">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : preview ? (
                  // Preview of captured / uploaded file
                  <div className="preview-box position-relative rounded overflow-hidden mb-3 border" style={{ height: "300px", borderColor: "var(--border-color)" }}>
                    <img src={preview} alt="ID Card Snapshot" className="w-100 h-100 object-fit-contain" />
                    <button
                      type="button"
                      onClick={resetScanner}
                      className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  // Upload Zone / Camera Activator
                  <div
                    className="upload-zone mb-3 d-flex flex-column align-items-center justify-content-center gap-3"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    style={{ height: "300px" }}
                  >
                    <FiUploadCloud size={48} className="text-muted" />
                    <div>
                      <p className="mb-1 text-light">Drag & drop ID card image here</p>
                      <p className="small text-muted mb-0">Supports JPG, JPEG, PNG (Max 5MB)</p>
                    </div>
                    <div className="d-flex gap-2 mt-2">
                      <label className="btn btn-sm btn-primary-custom m-0" style={{ cursor: "pointer" }}>
                        Browse File
                        <input type="file" className="d-none" accept="image/*" onChange={handleFileChange} />
                      </label>
                      <button type="button" onClick={startCamera} className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-2" style={{
                        borderColor: "var(--border-color)",
                        color: "var(--text-primary)"
                      }}>
                        <FiCamera size={14} /> Open Webcam
                      </button>
                    </div>
                  </div>
                )}

                {/* Scan Button Action */}
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={scanning || (!file && !cameraActive)}
                  className="btn btn-primary-custom w-100 py-3 d-flex align-items-center justify-content-center gap-2"
                >
                  {scanning ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                      Analyzing Document with Tesseract OCR...
                    </>
                  ) : (
                    <>
                      <FiCpu size={18} />
                      Extract Text & Match Details
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Results Display Panel */}
            <div className="col-12 col-lg-6">
              <div className="glass-card h-100">
                <h4 className="mb-4">2. Verification Result</h4>

                {scanning && (
                  <div className="d-flex flex-column align-items-center justify-content-center h-75 py-5 text-secondary gap-3">
                    <Loader message="" />
                    <p className="text-center text-muted" style={{ fontSize: "0.9rem" }}>
                      Tesseract is processing layout grid & extracting characters...<br />
                      This may take up to 8-12 seconds.
                    </p>
                  </div>
                )}

                {!scanning && !result && (
                  <div className="d-flex flex-column align-items-center justify-content-center h-75 py-5 text-secondary text-center">
                    <FiCpu size={40} className="text-muted mb-2" />
                    <p className="mb-0">Waiting for OCR input image capture.</p>
                  </div>
                )}

                {!scanning && result && (
                  <div className="animate-fade-in-up">
                    {/* Approved Card */}
                    {result.status === "APPROVED" ? (
                      <div className="p-3 rounded mb-4 d-flex align-items-center gap-3" style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid var(--accent-green)" }}>
                        <FiCheckCircle size={32} className="text-success" style={{ color: "var(--accent-green)" }} />
                        <div>
                          <h5 className="m-0 text-success fw-bold" style={{ color: "var(--accent-green)" }}>APPROVED</h5>
                          <small className="text-secondary">Candidate matches registration roster</small>
                        </div>
                      </div>
                    ) : (
                      /* Rejected Card */
                      <div className="p-3 rounded mb-4 d-flex align-items-center gap-3" style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid var(--accent-red)" }}>
                        <FiXCircle size={32} className="text-danger" style={{ color: "var(--accent-red)" }} />
                        <div>
                          <h5 className="m-0 text-danger fw-bold" style={{ color: "var(--accent-red)" }}>DENIED</h5>
                          <small className="text-secondary">{result.rejectionReason}</small>
                        </div>
                      </div>
                    )}

                    {/* Extracted Details Grid */}
                    <div className="d-flex flex-column gap-3">
                      <div className="d-flex align-items-center gap-3 p-3 rounded" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)" }}>
                        <FiUser size={20} className="text-muted" />
                        <div>
                          <small className="text-muted d-block uppercase" style={{ fontSize: "0.68rem", letterSpacing: "0.04em" }}>Extracted Candidate Name</small>
                          <span className="fw-semibold text-light">{result.scannedName}</span>
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-3 p-3 rounded" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)" }}>
                        <FiFileText size={20} className="text-muted" />
                        <div>
                          <small className="text-muted d-block uppercase" style={{ fontSize: "0.68rem", letterSpacing: "0.04em" }}>Extracted Roll Number</small>
                          <span className="fw-semibold text-light badge" style={{ background: "var(--primary-glow)", color: "var(--primary-light)", border: "1px solid var(--border-focus)", fontSize: "0.85rem" }}>
                            {result.scannedRollNumber}
                          </span>
                        </div>
                      </div>

                      <div className="row g-3">
                        <div className="col-6">
                          <div className="d-flex align-items-center gap-3 p-3 rounded" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)" }}>
                            <div>
                              <small className="text-muted d-block uppercase" style={{ fontSize: "0.68rem", letterSpacing: "0.04em" }}>Course</small>
                              <span className="fw-semibold text-light">{result.matchedDetails?.course || "N/A"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="d-flex align-items-center gap-3 p-3 rounded" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)" }}>
                            <div>
                              <small className="text-muted d-block uppercase" style={{ fontSize: "0.68rem", letterSpacing: "0.04em" }}>Match Score</small>
                              <span className={`fw-semibold ${result.matchPercentage > 50 ? "text-success" : "text-danger"}`}>
                                {result.matchPercentage}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="d-flex align-items-center gap-3 p-3 rounded" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)" }}>
                        <FiMapPin size={20} className="text-muted" />
                        <div>
                          <small className="text-muted d-block uppercase" style={{ fontSize: "0.68rem", letterSpacing: "0.04em" }}>Registered Examination Center</small>
                          <span className="fw-semibold text-light text-wrap">{result.matchedDetails?.examCenter || "No Center Registered"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Reset Button */}
                    <button type="button" onClick={resetScanner} className="btn btn-outline-secondary w-100 mt-4" style={{
                      borderColor: "var(--border-color)",
                      color: "var(--text-primary)"
                    }}>
                      Scan Another Candidate Card
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Verify;
