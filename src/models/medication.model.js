const mongoose = require("mongoose");

const medicationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    dosage: { type: String, required: true }, // e.g. "500mg"
    form: { type: String, enum: ["tablet", "capsule", "syrup", "injection", "drops", "other"] },
    frequency: {
      type: String,
      enum: ["once_daily", "twice_daily", "thrice_daily", "four_times", "weekly", "as_needed"],
      required: true,
    },
    times: [{ type: String }], // e.g. ["08:00", "20:00"]
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    prescribedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    instructions: { type: String }, // e.g. "Take after meals"
    sideEffects: [{ type: String }],
    isActive: { type: Boolean, default: true },
    reminderEnabled: { type: Boolean, default: true },
    adherenceLogs: [
      {
        scheduledAt: Date,
        takenAt: Date,
        status: { type: String, enum: ["taken", "missed", "skipped"], default: "missed" },
      },
    ],
    refillReminderAt: { type: Date },
    pillsRemaining: { type: Number },
  },
  { timestamps: true }
);

medicationSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model("Medication", medicationSchema);