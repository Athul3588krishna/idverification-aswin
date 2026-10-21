/**
 * utils/seedAdmin.js
 * ═══════════════════════════════════════════════════════════════
 * WHAT THIS FILE DOES:
 *   A one-time database seeder that creates the initial admin
 *   account when the server starts for the first time.
 *
 * WHY THIS IS NEEDED:
 *   Since the /api/auth/register route requires an existing admin
 *   to create new accounts, we need to bootstrap the very first
 *   admin without that route. This seeder does exactly that.
 *
 * HOW IT WORKS:
 *   1. Called once from server.js after DB connection.
 *   2. Checks if any admin account already exists.
 *   3. If not, creates one with credentials from .env
 *      (or safe defaults for development).
 *   4. If admin already exists, skips silently.
 *
 * SECURITY NOTE:
 *   Change ADMIN_DEFAULT_PASSWORD in .env immediately after
 *   first login in a production environment.
 * ═══════════════════════════════════════════════════════════════
 */

const User = require("../models/User");

const seedAdmin = async () => {
  try {
    // 1. Seed Admin
    const adminExists = await User.findOne({ role: "admin" });
    if (!adminExists) {
      await User.create({
        name: process.env.ADMIN_NAME || "ExamShield Admin",
        email: process.env.ADMIN_EMAIL || "admin@examshield.com",
        password: process.env.ADMIN_PASSWORD || "Admin@123",
        role: "admin",
        isActive: true,
      });
      console.log("✅ Default admin account created:");
      console.log(`   Email   : ${process.env.ADMIN_EMAIL || "admin@examshield.com"}`);
      console.log(`   Password: ${process.env.ADMIN_PASSWORD || "Admin@123"}`);
      console.log("   ⚠️  Change this password after first login!\n");
    }

    // 2. Seed Security Staff
    const securityExists = await User.findOne({ email: "security@examshield.com" });
    if (!securityExists) {
      await User.create({
        name: "Security Staff Gate 1",
        email: "security@examshield.com",
        password: "Security@123",
        role: "security_staff",
        isActive: true,
      });
      console.log("✅ Default security staff account created:");
      console.log("   Email   : security@examshield.com");
      console.log("   Password: Security@123\n");
    }

    // 3. Demo Student seeding is disabled so student roster starts completely clean.
    // Uncomment below if a pre-seeded student account is ever needed.
    /*
    const studentExists = await User.findOne({ email: "aswin@examshield.com" });
    if (!studentExists) {
      await User.create({
        name: "ASWIN KRISHNA",
        email: "aswin@examshield.com",
        password: "Student@123",
        role: "student",
        isActive: true,
        studentProfile: {
          rollNumber: "MCA26001",
          course: "MCA",
          semester: 2,
          examCenter: "Hall A - Room 101",
          dob: "1998-05-15",
          idNumber: "123456789012",
          examSubject: "MCA Entrance Examination 2026",
          examDate: "2026-08-10",
          examTime: "10:00 AM - 1:00 PM",
          idCardImageUrl: "/uploads/photo_MCA26001.png"
        }
      });
    }
    */

  } catch (error) {
    console.error("❌ Failed to seed database:", error.message);
  }
};

module.exports = seedAdmin;
