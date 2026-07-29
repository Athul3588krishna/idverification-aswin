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

module.exports = {
  sendOTPEmail
};
