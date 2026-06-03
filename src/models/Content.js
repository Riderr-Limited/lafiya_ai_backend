const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  titleHausa: String,
  body: { type: String, required: true },
  bodyHausa: String,
  category: {
    type: String,
    enum: ['maternal_health', 'diabetes', 'nutrition', 'hygiene', 'mental_health', 'general'],
    required: true,
  },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isVerified: { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: Date,
  trustScore: { type: Number, default: 0, min: 0, max: 100 },
  tags: [String],
  mediaUrl: String,
  views: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Content', contentSchema);
