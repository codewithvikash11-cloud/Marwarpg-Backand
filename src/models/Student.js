const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const studentSchema = new mongoose.Schema({
  // Personal Details
  name: { type: String, required: true },
  fatherName: { type: String, required: true },
  motherName: { type: String, required: true },
  dob: { type: Date, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
  phone: { type: String, required: true },
  altPhone: { type: String },
  email: { type: String, required: true },
  aadhaarNumber: { type: String, required: true },

  // Address Details
  permanentAddress: {
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String }
  },
  currentAddress: {
    address: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String }
  },

  // Education/Occupation Details
  education: {
    occupationType: { type: String, enum: ['Student', 'Working Professional'] },
    collegeName: { type: String },
    courseName: { type: String },
    companyName: { type: String }
  },

  // Emergency Contact
  emergencyContact: {
    guardianName: { type: String },
    relation: { type: String },
    phone: { type: String },
    altPhone: { type: String }
  },

  // Preferences
  preferences: {
    roomType: { type: String, enum: ['AC', 'Non-AC'] },
    sharingType: { type: String, enum: ['Single', 'Double', 'Triple'] },
    preferredJoiningDate: { type: Date }
  },

  // Tiffin Details
  tiffinPlan: { type: String, enum: ['Basic', 'Standard', 'Premium', 'None'], default: 'Basic' },

  // Documents (URLs)
  documents: {
    aadhaarFront: { type: String },
    aadhaarBack: { type: String },
    photo: { type: String },
    signature: { type: String },
    collegeId: { type: String },
    panCard: { type: String }
  },

  // Application / PG Metadata
  applicationId: { type: String, unique: true },
  status: { type: String, enum: ['Pending Verification', 'Active', 'Rejected', 'Left'], default: 'Pending Verification' },
  room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  bedNumber: { type: String },
  joinedAt: { type: Date },

  // Auth Credentials (generated on approval)
  studentId: { type: String, unique: true, sparse: true },
  username: { type: String, unique: true, sparse: true },
  password: { type: String },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Date },
  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date }
}, { timestamps: true });

studentSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  if (!this.password.startsWith('$2')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

studentSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Student', studentSchema);
