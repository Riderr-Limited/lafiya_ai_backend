const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      required: true,
      enum: [
        "new_post",
        "new_comment",
        "like",
        "appointment_confirmed",
        "appointment_reminder",
        "appointment_cancelled",
        "medication_reminder",
        "pregnancy_milestone",
        "doctor_tip",
        "community_invite",
        "record_shared",
        "emergency_alert",
        "system",
        "campaign",
      ],
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed }, // extra context data
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    link: { type: String }, // deep link
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);