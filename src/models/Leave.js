const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  leaveDate: { type: Date, required: true },
  returnDate: { type: Date, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  adminRemarks: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Leave', leaveSchema);
