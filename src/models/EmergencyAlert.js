const mongoose = require('mongoose');

const emergencyAlertSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  location: { lat: Number, lng: Number },
  message: String,
  respondedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('EmergencyAlert', emergencyAlertSchema);
