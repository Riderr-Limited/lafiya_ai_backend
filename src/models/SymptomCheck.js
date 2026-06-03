const mongoose = require('mongoose');

const symptomCheckSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symptoms: [{ type: String, required: true }],
  language: { type: String, enum: ['hausa', 'english'], default: 'hausa' },
  patientAge: Number,
  patientGender: { type: String, enum: ['male', 'female'] },
  isPregnant: { type: Boolean, default: false },
  aiResponse: {
    summary: String,
    riskLevel: { type: String, enum: ['low', 'medium', 'high', 'emergency'] },
    recommendations: [String],
    nextSteps: [String],
    escalate: { type: Boolean, default: false },
    rawResponse: String,
  },
  doctorReview: {
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String,
    reviewedAt: Date,
  },
}, { timestamps: true });

module.exports = mongoose.model('SymptomCheck', symptomCheckSchema);
