/**
 * utils/mailer.js
 * ═══════════════════════════════════════════════════════════════
 * Transporter setup using Nodemailer.
 * Sends OTP codes to registered students.
 * Logs to console as a fallback in development.
 * ═══════════════════════════════════════════════════════════════
 */

const nodemailer = require("nodemailer");

/**
 * Sends a registration OTP to the candidate.
 * @param {string} email 
 * @param {string} otpCode 
 */
const sendOTPEmail = async (email, otpCode) => {
  // Always log to console in development so developers can see the code immediately
  console.log(`\n================================================`);
  console.log(`📨  OTP Code for ${email}: ${otpCode}`);
  console.log(`================================================\n`);

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("⚠️  SMTP_USER and SMTP_PASS environment variables are not configured. Email not sent via network. Check console log above for the code.");
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const mailOptions = {
    from: `"ExamShield Admin" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "ExamShield Registration - One Time Password (OTP)",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #0f0f15; color: #ffffff;">
        <h2 style="color: #4f46e5; text-align: center;">ExamShield Identity Verification</h2>
        <hr style="border: 0; border-top: 1px solid #333; margin: 20px 0;">
        <p>Hello Candidate,</p>
        <p>Thank you for initiating your self-registration. Please use the following One-Time Password (OTP) code to verify your email address. This code is valid for 5 minutes.</p>
        <div style="background-color: rgba(79, 70, 229, 0.15); border: 1px dashed #4f46e5; padding: 15px; border-radius: 6px; text-align: center; margin: 25px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #a5b4fc;">${otpCode}</span>
        </div>
        <p style="color: #6b7280; font-size: 13px; text-align: center; margin-top: 30px;">If you did not request this code, please ignore this email.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Sends candidate approval and hall ticket allocation notification email.
 * @param {string} email
 * @param {string} candidateName
 * @param {string} rollNumber
 * @param {string} allocatedHall
 * @param {string} allocatedSeat
 * @param {string} examSubject
 */
const sendApprovalEmail = async (email, candidateName, rollNumber, allocatedHall, allocatedSeat, examSubject = "Entrance Examination 2026") => {
  console.log(`\n================================================`);
  console.log(`🎉 [Candidate Approval Notification]`);
  console.log(`To: ${email}`);
  console.log(`Candidate: ${candidateName} (Roll: ${rollNumber})`);
  console.log(`Allocated Hall: ${allocatedHall}`);
  console.log(`Allocated Seat: ${allocatedSeat}`);
  console.log(`Status: APPROVED & READY FOR DOWNLOAD`);
  console.log(`================================================\n`);

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"ExamShield Examination Cell" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `🎉 Registration Approved! Hall Ticket Ready - ${rollNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #3730a3; border-radius: 12px; background-color: #0f0f15; color: #ffffff;">
          <h2 style="color: #6366f1; text-align: center; margin-bottom: 6px;">ExamShield Examination Cell</h2>
          <p style="text-align: center; color: #94a3b8; font-size: 13px; margin-top: 0;">Official Identity & Verification Authority</p>
          <hr style="border: 0; border-top: 1px solid #272738; margin: 20px 0;">
          
          <h3 style="color: #10b981;">Congratulations ${candidateName}!</h3>
          <p>Your self-registration for <strong>${examSubject}</strong> has been successfully reviewed and <strong>APPROVED</strong> by the Examination Administrator.</p>
          
          <div style="background-color: rgba(99, 102, 241, 0.1); border: 1px solid #4f46e5; border-radius: 8px; padding: 18px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; color: #e2e8f0; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #94a3b8;">Candidate Name:</td>
                <td style="padding: 6px 0; font-weight: bold; text-align: right;">${candidateName}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94a3b8;">Registration / Roll No:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #a5b4fc; text-align: right;">${rollNumber}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94a3b8;">Assigned Exam Hall:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #34d399; text-align: right;">${allocatedHall || "Block B - Room 204"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94a3b8;">Assigned Desk / Seat:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #34d399; text-align: right;">${allocatedSeat || "Desk #18"}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #94a3b8;">Verification Status:</td>
                <td style="padding: 6px 0; font-weight: bold; color: #10b981; text-align: right;">✓ ADMIT CARD UNLOCKED</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 14px; color: #cbd5e1;">Your official Admit Card with your encrypted Verification QR Code is now fully unlocked. You can log in to your student portal anytime to view or print it.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173/student/login" style="background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              Download Official Admit Card
            </a>
          </div>

          <p style="color: #64748b; font-size: 12px; text-align: center;">Please print a physical copy of your admit card and carry a valid photo ID on examination day.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Failed to send approval email via network:", err.message);
  }
};

module.exports = {
  sendOTPEmail,
  sendApprovalEmail,
};

