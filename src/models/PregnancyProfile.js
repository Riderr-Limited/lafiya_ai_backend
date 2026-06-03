const mongoose = require('mongoose');

const pregnancyProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  lastMenstrualPeriod: { type: Date, required: true },
  dueDate: Date,
  currentWeek: Number,
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('PregnancyProfile', pregnancyProfileSchema);
