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
      serverSelectionTimeoutMS: 3000, // Timeout after 3 seconds for quick fallback
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.warn(`⚠️ Switching to Local JSON File Database Mode (Mock DB)!`);
    global.useMockDB = true;
  }
};

module.exports = connectDB;
