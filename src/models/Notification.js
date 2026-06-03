const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['medication_reminder', 'appointment_reminder', 'consultation_update', 'new_session', 'post_reply', 'general'],
    default: 'general',
  },
  title: String,
  body: String,
  read: { type: Boolean, default: false },
  data: Object,
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
