const mongoose = require("mongoose");

const aiSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sessionId: { type: String, required: true, unique: true },
    messages: [
      {
        role: { type: String, enum: ["user", "assistant"], required: true },
        content: { type: String, required: true },
        language: { type: String, enum: ["en", "ha"], default: "en" },
        timestamp: { type: Date, default: Date.now },
        inputType: { type: String, enum: ["text", "voice"], default: "text" },
      },
    ],
    context: { type: String }, // e.g., "symptom_check", "pregnancy", "medication"
    urgencyLevel: { type: String, enum: ["low", "moderate", "high", "emergency"] },
    recommendedAction: { type: String }, // e.g. "visit hospital", "rest at home"
    doctorReferred: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    hospitalReferred: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
    isResolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AISession", aiSessionSchema);