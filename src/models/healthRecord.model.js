const mongoose = require("mongoose");

const healthRecordSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      required: true,
      enum: [
        "lab_result",
        "prescription",
        "scan",
        "medical_report",
        "vaccination",
        "surgery",
        "allergy",
        "vitals",
        "other",
      ],
    },
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
    files: [
      {
        url: { type: String },
        publicId: { type: String },
        name: { type: String },
        fileType: { type: String },
      },
    ],
    vitals: {
      bloodPressure: { systolic: Number, diastolic: Number },
      heartRate: Number,
      temperature: Number,
      weight: Number,
      height: Number,
      bloodSugar: Number,
      oxygenSaturation: Number,
    },
    tags: [{ type: String }],
    isSharedWithDoctor: { type: Boolean, default: false },
    sharedWithDoctors: [{ type: mongoose.Schema.Types.ObjectId, ref: "Doctor" }],
    isPrivate: { type: Boolean, default: true },
  },
  { timestamps: true }
);

healthRecordSchema.index({ user: 1, type: 1, date: -1 });

module.exports = mongoose.model("HealthRecord", healthRecordSchema);