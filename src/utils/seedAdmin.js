require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const adminExists = await Admin.findOne({ email: 'admin@royalmarwarpg.com' });
    
    if (adminExists) {
      console.log('Admin already exists.');
      // Update password just in case
      adminExists.password = 'Admin@123456';
      adminExists.forcePasswordChange = true;
      adminExists.loginAttempts = 0;
      adminExists.lockUntil = undefined;
      await adminExists.save();
      console.log('Admin password reset successfully.');
    } else {
      await Admin.create({
        email: 'admin@royalmarwarpg.com',
        password: 'Admin@123456',
        forcePasswordChange: true
      });
      console.log('Admin seeded successfully.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
