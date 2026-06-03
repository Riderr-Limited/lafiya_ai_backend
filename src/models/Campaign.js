const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  category: { type: String, enum: ['malaria', 'hygiene', 'vaccination', 'maternal', 'diabetes', 'general'] },
  targetGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityGroup' },
  language: { type: String, enum: ['hausa', 'english', 'both'], default: 'both' },
  imageUrl: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sentAt: Date,
  status: { type: String, enum: ['draft', 'sent'], default: 'draft' },
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);
