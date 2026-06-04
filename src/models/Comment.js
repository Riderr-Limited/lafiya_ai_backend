const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    likeCount: { type: Number, default: 0 },
    isAnonymous: { type: Boolean, default: false },
    anonymousName: { type: String },
    isVerifiedDoctorComment: { type: Boolean, default: false },
    flagged: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    mediaUrl: { type: String },
  },
  { timestamps: true }
);

commentSchema.index({ post: 1, createdAt: 1 });

module.exports = mongoose.model("Comment", commentSchema);