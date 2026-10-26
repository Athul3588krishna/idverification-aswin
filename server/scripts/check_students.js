const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');
const VerificationLog = require('../models/VerificationLog');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const totalUsers = await User.countDocuments();
    const students = await User.find({ role: 'student' }).select('name email studentProfile isActive');
    const nonStudents = await User.find({ role: { $ne: 'student' } }).select('name email role');
    const logs = await VerificationLog.countDocuments();

    console.log('Total users:', totalUsers);
    console.log('Non-student accounts:', nonStudents.map(u => ({ name: u.name, email: u.email, role: u.role })));
    console.log('Students count:', students.length);
    console.log('Students list:');
    students.forEach((s, idx) => {
      console.log(`[${idx + 1}] Roll: ${s.studentProfile?.rollNumber || 'N/A'} | Name: ${s.name} | Email: ${s.email} | Active: ${s.isActive}`);
    });
    console.log('Total Verification Logs count:', logs);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

check();
