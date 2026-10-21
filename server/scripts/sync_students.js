const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
const User = require('../models/User');
const mockUsers = require('../data/mock_users.json');

async function syncStudents() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const studentMocks = mockUsers.filter(u => u.role === 'student');
  console.log('Found', studentMocks.length, 'students in mock_users.json');

  let updated = 0;
  let inserted = 0;

  for (const mock of studentMocks) {
    const roll = mock.studentProfile?.rollNumber;
    if (!roll) continue;

    const existing = await User.findOne({
      $or: [
        { 'studentProfile.rollNumber': roll },
        { email: mock.email.toLowerCase() }
      ]
    });

    if (existing) {
      existing.name = mock.name;
      existing.email = mock.email.toLowerCase();
      existing.studentProfile = { ...existing.studentProfile?.toObject(), ...mock.studentProfile };
      existing.isActive = mock.isActive;
      await existing.save({ validateBeforeSave: false });
      console.log('✓ Updated:', roll, mock.name, 'Active:', mock.isActive);
      updated++;
    } else {
      await User.create({
        name: mock.name,
        email: mock.email.toLowerCase(),
        password: mock.password,
        role: 'student',
        isActive: mock.isActive,
        studentProfile: mock.studentProfile
      });
      console.log('+ Inserted:', roll, mock.name, 'Active:', mock.isActive);
      inserted++;
    }
  }

  console.log('Sync complete! Updated:', updated, 'Inserted:', inserted);
  process.exit(0);
}

syncStudents().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
