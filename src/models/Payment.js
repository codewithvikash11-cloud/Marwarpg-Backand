const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  amount: { type: Number, required: true },
  month: { type: String, required: true },
  year: { type: Number, required: true },
  date: { type: Date, required: true },
  paymentMode: { type: String, enum: ['Cash', 'UPI', 'Bank Transfer'], required: true },
  transactionId: { type: String },
  type: { type: String, enum: ['Rent', 'Deposit', 'Other'], default: 'Rent' },
  status: { type: String, enum: ['Success', 'Pending', 'Failed'], default: 'Success' },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
