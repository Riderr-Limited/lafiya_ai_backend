const mongoose = require("mongoose");

const hospitalSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ["federal", "state", "private", "ngo", "clinic", "pharmacy"],
      default: "private",
    },
    address: { type: String, required: true },
    lga: { type: String },
    state: { type: String, default: "Kano" },
    phone: [{ type: String }],
    email: { type: String },
    website: { type: String },
    location: {
      type: { type: String, default: "Point" },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },
    services: [{ type: String }],
    specialties: [{ type: String }],
    emergencyAvailable: { type: Boolean, default: false },
    emergencyPhone: { type: String },
    openingHours: {
      weekdays: String,
      weekends: String,
      is24Hours: { type: Boolean, default: false },
    },
    images: [{ type: String }],
    rating: { type: Number, default: 0 },
    totalRatings: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    acceptsTelemedicine: { type: Boolean, default: false },
    insuranceProviders: [{ type: String }],
  },
  { timestamps: true }
);

hospitalSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Hospital", hospitalSchema);