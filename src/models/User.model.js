const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: ["patient", "doctor", "nurse", "admin", "moderator"],
      default: "patient",
    },
    avatar: { type: String, default: null },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["male", "female", "other"] },
    location: {
      state: { type: String, default: "Kano" },
      lga: { type: String },
      address: { type: String },
    },
    preferredLanguage: {
      type: String,
      enum: ["en", "ha", "yo", "ig"],
      default: "en",
    },
    healthConditions: [{ type: String }], // e.g. ["diabetes", "hypertension"]
    communities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Community" }],
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isAnonymousMode: { type: Boolean, default: false },
    anonymousName: { type: String, default: null },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpiry: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpiry: { type: Date, select: false },
    fcmToken: { type: String }, // Firebase push notification token
    lastSeen: { type: Date, default: Date.now },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },
  },
  { timestamps: true }
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.emailVerificationToken;
  delete obj.passwordResetToken;
  return obj;
};

module.exports = mongoose.model("User", userSchema);