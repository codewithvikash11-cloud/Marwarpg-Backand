const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  floor: { type: Number, required: true },
  type: { type: String, enum: ['AC', 'Non-AC'], required: true },
  sharing: { type: String, enum: ['Single', 'Double', 'Triple'], required: true },
  capacity: { type: Number, required: true },
  occupiedBeds: { type: Number, default: 0 },
  rent: { type: Number, required: true },
  deposit: { type: Number, required: true },
  amenities: [{ type: String }],
  status: { type: String, enum: ['Available', 'Full', 'Maintenance'], default: 'Available' },
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
