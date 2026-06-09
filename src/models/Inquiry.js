const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  mobileNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  interestedRoomType: {
    type: String,
    required: true
  },
  message: {
    type: String
  },
  sourcePage: {
    type: String,
    default: 'Website'
  },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Converted', 'Closed'],
    default: 'New'
  }
}, { timestamps: true });

module.exports = mongoose.model('Inquiry', inquirySchema);
