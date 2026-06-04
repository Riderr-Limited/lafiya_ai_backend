const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
    type: {
      type: String,
      enum: ["in_person", "telemedicine_video", "telemedicine_audio"],
      default: "in_person",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed", "no_show"],
      default: "pending",
    },
    scheduledAt: { type: Date, required: true },
    duration: { type: Number, default: 30 }, // minutes
    reason: { type: String, required: true },
    symptoms: [{ type: String }],
    notes: { type: String },
    doctorNotes: { type: String },
    prescription: { type: String },
    meetingLink: { type: String }, // for telemedicine
    fee: { type: Number, default: 0 },
    isPaid: { type: Boolean, default: false },
    paymentReference: { type: String },
    cancelReason: { type: String },
    cancelledBy: { type: String, enum: ["patient", "doctor"] },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String },
  },
  { timestamps: true }
);

appointmentSchema.index({ patient: 1, scheduledAt: -1 });
appointmentSchema.index({ doctor: 1, scheduledAt: -1 });

module.exports = mongoose.model("Appointment", appointmentSchema);