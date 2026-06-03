const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  dosage: String,
  frequency: { type: String, enum: ['daily', 'twice_daily', 'weekly', 'as_needed'] },
  times: [String], // e.g. ["08:00", "20:00"]
  startDate: Date,
  endDate: Date,
  active: { type: Boolean, default: true },
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model('Medication', medicationSchema);
