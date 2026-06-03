const mongoose = require('mongoose');

const healthLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  metrics: {
    bloodPressure: String,
    bloodSugar: Number,
    weight: Number,
    temperature: Number,
    heartRate: Number,
  },
  mood: { type: String, enum: ['good', 'fair', 'poor'] },
  notes: String,
  medications: [{ name: String, taken: Boolean }],
}, { timestamps: true });

module.exports = mongoose.model('HealthLog', healthLogSchema);
