const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    specialization: { type: String, required: true },
    subSpecialization: { type: String },
    licenseNumber: { type: String, required: true, unique: true },
    mdcnNumber: { type: String }, // Medical & Dental Council of Nigeria
    yearsOfExperience: { type: Number, default: 0 },
    qualifications: [{ degree: String, institution: String, year: Number }],
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
    bio: { type: String, maxlength: 1000 },
    languages: [{ type: String, default: ["en", "ha"] }],
    consultationFee: { type: Number, default: 0 },
    isAvailableForTelemedicine: { type: Boolean, default: true },
    availability: [
      {
        day: { type: String, enum: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
        startTime: String,
        endTime: String,
      },
    ],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    totalConsultations: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    verificationDocument: { type: String }, // URL to uploaded document
    communities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Community" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);