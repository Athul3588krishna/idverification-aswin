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
    // Check if an admin already exists in the database
    const adminExists = await User.findOne({ role: "admin" });

    if (adminExists) {
      // Admin already seeded — nothing to do
      return;
    }

    // Create the default admin account
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
  } catch (error) {
    console.error("❌ Failed to seed admin:", error.message);
  }
};

module.exports = seedAdmin;
