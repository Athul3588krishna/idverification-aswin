/**
 * utils/otpStore.js
 * ═══════════════════════════════════════════════════════════════
 * In-memory storage for email OTP codes.
 * Ensures the OTP mechanism is lightweight and database-independent.
 * ═══════════════════════════════════════════════════════════════
 */

const otpStore = new Map();

/**
 * Generates a random 6-digit OTP code.
 * @returns {string}
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Saves an OTP for a given email address. Expires in 5 minutes.
 * @param {string} email 
 * @param {string} code 
 */
const saveOTP = (email, code) => {
  const normalizedEmail = email.toLowerCase().trim();
  otpStore.set(normalizedEmail, code);

  // Automatically invalidate OTP after 5 minutes
  setTimeout(() => {
    if (otpStore.get(normalizedEmail) === code) {
      otpStore.delete(normalizedEmail);
      console.log(`🧹 Expired OTP code for ${normalizedEmail}`);
    }
  }, 5 * 60 * 1000);
};

/**
 * Verifies if the provided OTP code matches the saved code for the email.
 * Consumes/deletes the OTP code if match succeeds.
 * @param {string} email 
 * @param {string} code 
 * @returns {boolean}
 */
const verifyOTP = (email, code) => {
  const normalizedEmail = email.toLowerCase().trim();
  const savedCode = otpStore.get(normalizedEmail);

  if (savedCode && savedCode === code.trim()) {
    otpStore.delete(normalizedEmail); // Invalidate immediately upon successful use
    return true;
  }
  return false;
};

module.exports = {
  generateOTP,
  saveOTP,
  verifyOTP
};
