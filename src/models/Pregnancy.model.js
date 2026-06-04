const mongoose = require("mongoose");

const pregnancySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lastMenstrualPeriod: { type: Date, required: true },
    dueDate: { type: Date },
    currentWeek: { type: Number },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
    isHighRisk: { type: Boolean, default: false },
    riskFactors: [{ type: String }],
    antenatalVisits: [
      {
        date: Date,
        week: Number,
        weight: Number,
        bloodPressure: { systolic: Number, diastolic: Number },
        fetalHeartRate: Number,
        fundalHeight: Number,
        notes: String,
        doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
      },
    ],
    vaccinations: [
      {
        vaccine: String,
        dateGiven: Date,
        nextDue: Date,
        hospital: String,
      },
    ],
    symptoms: [
      {
        symptom: String,
        date: Date,
        severity: { type: String, enum: ["mild", "moderate", "severe"] },
      },
    ],
    birthPlan: { type: String },
    deliveryType: { type: String, enum: ["vaginal", "c_section", "assisted", "not_yet"] },
    deliveredAt: { type: Date },
    babyWeight: { type: Number },
    babyGender: { type: String, enum: ["male", "female", "unknown"] },
    isCompleted: { type: Boolean, default: false },
    reminders: [
      {
        title: String,
        dueAt: Date,
        isSent: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

// Auto-calculate due date and current week
pregnancySchema.pre("save", function (next) {
  if (this.lastMenstrualPeriod) {
    const lmp = new Date(this.lastMenstrualPeriod);
    this.dueDate = new Date(lmp.getTime() + 280 * 24 * 60 * 60 * 1000); // 40 weeks
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    this.currentWeek = Math.floor((Date.now() - lmp.getTime()) / msPerWeek);
  }
  next();
});

module.exports = mongoose.model("Pregnancy", pregnancySchema);