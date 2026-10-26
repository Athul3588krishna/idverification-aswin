const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');
const VerificationLog = require('../models/VerificationLog');

async function removeExistingStudents() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Successfully connected to MongoDB database');

    // 1. Find all existing students
    const existingStudents = await User.find({ role: 'student' }).lean();

    if (!existingStudents || existingStudents.length === 0) {
      console.log('ℹ No existing students found in the database. Database is already free of student data.');
      process.exit(0);
    }

    console.log(`Found ${existingStudents.length} student candidate(s) in the database:`);
    existingStudents.forEach((s, idx) => {
      console.log(`  [${idx + 1}] Roll: ${s.studentProfile?.rollNumber || 'N/A'} | Name: ${s.name} | Email: ${s.email} (ID: ${s._id})`);
    });

    // 2. Backup deleted student data locally for safety
    const backupDir = path.join(__dirname, '../data/backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `students_backup_${timestamp}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(existingStudents, null, 2), 'utf-8');
    console.log(`✓ Backup saved to: ${backupPath}`);

    const studentIds = existingStudents.map(s => s._id);

    // 3. Delete student records from User collection
    const deleteResult = await User.deleteMany({ role: 'student' });
    console.log(`✓ Deleted ${deleteResult.deletedCount} student records from 'users' collection.`);

    // 4. Update any verification logs referencing these deleted students so references are not orphaned
    const logUpdateResult = await VerificationLog.updateMany(
      { student: { $in: studentIds } },
      { $set: { student: null } }
    );
    console.log(`✓ Updated ${logUpdateResult.modifiedCount} verification log(s) to disassociate removed student references.`);

    // 5. Verification check
    const remainingStudents = await User.countDocuments({ role: 'student' });
    const totalUsers = await User.countDocuments();
    console.log('--- Verification ---');
    console.log(`Remaining students in DB: ${remainingStudents}`);
    console.log(`Total remaining users in DB (Admins & Staff): ${totalUsers}`);

    process.exit(0);
  } catch (error) {
    console.error('✗ Error removing students:', error);
    process.exit(1);
  }
}

removeExistingStudents();
