const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    community: { type: mongoose.Schema.Types.ObjectId, ref: "Community", required: true },
    title: { type: String, trim: true },
    content: { type: String, required: true },
    language: { type: String, enum: ["en", "ha", "yo", "ig"], default: "en" },
    type: {
      type: String,
      enum: ["text", "question", "announcement", "health_tip", "live_session", "voice_note", "video"],
      default: "text",
    },
    mediaUrls: [
      {
        url: String,
        type: { type: String, enum: ["image", "video", "audio", "document"] },
        publicId: String,
      },
    ],
    tags: [{ type: String }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    saves: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    commentCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    isAnonymous: { type: Boolean, default: false },
    anonymousName: { type: String },
    isPinned: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: true },
    flagged: { type: Boolean, default: false },
    flagReason: { type: String },
    isVerifiedDoctorPost: { type: Boolean, default: false },
    liveSession: {
      scheduledAt: Date,
      joinLink: String,
      isLive: { type: Boolean, default: false },
      endedAt: Date,
    },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

postSchema.index({ community: 1, createdAt: -1 });
postSchema.index({ author: 1 });
postSchema.index({ tags: 1 });

module.exports = mongoose.model("Post", postSchema);