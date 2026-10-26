
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000, // 15s timeout for reliable connection to MongoDB Atlas
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.warn(`⚠️ Switching to Local JSON File Database Mode (Mock DB)!`);
    global.useMockDB = true;
  }
};

module.exports = connectDB;
