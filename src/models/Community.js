const mongoose = require('mongoose');

const communityGroupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameHausa: String,
  category: {
    type: String,
    enum: ['maternal_health', 'diabetes', 'chronic_illness', 'general', 'mental_health'],
    required: true,
  },
  description: String,
  descriptionHausa: String,
  moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const postSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'CommunityGroup', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  language: { type: String, enum: ['hausa', 'english'], default: 'hausa' },
  type: { type: String, enum: ['question', 'story', 'info', 'alert'], default: 'question' },
  isMisinformation: { type: Boolean, default: false },
  misinformationNote: String,
  flaggedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  doctorVerified: { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  replies: [{
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    isDoctor: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  }],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  anonymous: { type: Boolean, default: false },
}, { timestamps: true });

const CommunityGroup = mongoose.model('CommunityGroup', communityGroupSchema);
const Post = mongoose.model('Post', postSchema);

module.exports = { CommunityGroup, Post };
