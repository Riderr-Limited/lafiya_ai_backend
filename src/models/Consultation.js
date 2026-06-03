const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['video', 'audio', 'text'], default: 'video' },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'rejected', 'completed', 'cancelled'],
    default: 'pending',
  },
  scheduledAt: Date,
  durationMinutes: { type: Number, default: 30 },
  reason: String,
  meetingLink: String,
  notes: String,
  attachedRecords: [{ type: mongoose.Schema.Types.ObjectId, ref: 'HealthRecord' }],
}, { timestamps: true });

module.exports = mongoose.model('Consultation', consultationSchema);
