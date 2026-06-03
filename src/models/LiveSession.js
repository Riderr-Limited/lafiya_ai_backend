const mongoose = require('mongoose');

const liveSessionSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityGroup' },
  title: { type: String, required: true },
  description: String,
  scheduledAt: { type: Date, required: true },
  durationMinutes: { type: Number, default: 60 },
  meetingLink: String,
  language: { type: String, enum: ['hausa', 'english'], default: 'hausa' },
  status: { type: String, enum: ['scheduled', 'live', 'completed', 'cancelled'], default: 'scheduled' },
}, { timestamps: true });

module.exports = mongoose.model('LiveSession', liveSessionSchema);
