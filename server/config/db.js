/**
 * config/db.js
 * ---------------------------------------------------------
 * Establishes and manages the MongoDB connection using
 * Mongoose. Exported as an async function called once
 * during server startup.
 */

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 7+ no longer needs these options, but kept for clarity
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Exit the process with failure so the server doesn't run without a DB
    process.exit(1);
  }
};

module.exports = connectDB;
