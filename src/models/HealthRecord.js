const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['lab_result', 'prescription', 'scan', 'pregnancy_record', 'medical_report', 'other'],
    required: true,
  },
  title: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: String,
  fileSize: Number,
  notes: String,
  date: { type: Date, default: Date.now },
  sharedWithDoctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('HealthRecord', healthRecordSchema);
