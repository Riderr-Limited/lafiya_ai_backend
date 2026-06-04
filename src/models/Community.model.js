const mongoose = require("mongoose");

const communitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: [
        "kidney_disease",
        "liver_disease",
        "heart_conditions",
        "malaria",
        "diabetes",
        "pregnancy_maternal",
        "hypertension",
        "mental_health",
        "cancer",
        "hiv_aids",
        "tuberculosis",
        "sickle_cell",
        "general_health",
        "other",
      ],
    },
    coverImage: { type: String },
    icon: { type: String },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    moderators: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    doctors: [{ type: mongoose.Schema.Types.ObjectId, ref: "Doctor" }],
    isPrivate: { type: Boolean, default: false },
    rules: [{ type: String }],
    totalPosts: { type: Number, default: 0 },
    totalMembers: { type: Number, default: 0 },
    pinnedPost: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
    language: { type: String, enum: ["en", "ha", "both"], default: "both" },
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Auto-generate slug
communitySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = this.name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
  }
  next();
});

module.exports = mongoose.model("Community", communitySchema);