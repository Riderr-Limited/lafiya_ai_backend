const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    type: {
      type: String,
      enum: ["awareness", "vaccination", "screening", "hygiene", "nutrition", "maternal"],
    },
    content: { type: String },
    language: { type: String, enum: ["en", "ha", "both"], default: "both" },
    coverImage: { type: String },
    attachments: [{ url: String, name: String }],
    targetAudience: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    sponsor: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    communities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Community" }],
    isPublished: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Campaign", campaignSchema);