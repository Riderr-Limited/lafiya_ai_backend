const Medication = require("../models/medication.model");
const AppError = require("../utils/AppError");
const { createNotification } = require("../utils/notification.utils");

// GET /api/medications
exports.getMyMedications = async (req, res, next) => {
  try {
    const { isActive } = req.query;
    const filter = { user: req.user._id };
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const medications = await Medication.find(filter)
      .populate("prescribedBy", "specialization")
      .sort("-createdAt");

    res.status(200).json({ success: true, medications });
  } catch (error) {
    next(error);
  }
};

// GET /api/medications/:id
exports.getMedication = async (req, res, next) => {
  try {
    const medication = await Medication.findOne({ _id: req.params.id, user: req.user._id });
    if (!medication) return next(new AppError("Medication not found", 404));
    res.status(200).json({ success: true, medication });
  } catch (error) {
    next(error);
  }
};

// POST /api/medications
exports.createMedication = async (req, res, next) => {
  try {
    const {
      name, dosage, form, frequency, times, startDate, endDate,
      prescribedBy, instructions, sideEffects, pillsRemaining,
    } = req.body;

    const medication = await Medication.create({
      user: req.user._id,
      name,
      dosage,
      form,
      frequency,
      times: times ? (Array.isArray(times) ? times : JSON.parse(times)) : [],
      startDate,
      endDate,
      prescribedBy: prescribedBy || undefined,
      instructions,
      sideEffects: sideEffects ? (Array.isArray(sideEffects) ? sideEffects : sideEffects.split(",")) : [],
      pillsRemaining,
    });

    res.status(201).json({ success: true, message: "Medication added", medication });
  } catch (error) {
    next(error);
  }
};

// PUT /api/medications/:id
exports.updateMedication = async (req, res, next) => {
  try {
    const medication = await Medication.findOne({ _id: req.params.id, user: req.user._id });
    if (!medication) return next(new AppError("Medication not found", 404));

    const allowed = ["name", "dosage", "form", "frequency", "times", "endDate",
      "instructions", "isActive", "reminderEnabled", "pillsRemaining", "refillReminderAt"];
    allowed.forEach((f) => { if (req.body[f] !== undefined) medication[f] = req.body[f]; });

    await medication.save();
    res.status(200).json({ success: true, message: "Medication updated", medication });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/medications/:id
exports.deleteMedication = async (req, res, next) => {
  try {
    await Medication.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.status(200).json({ success: true, message: "Medication removed" });
  } catch (error) {
    next(error);
  }
};

// POST /api/medications/:id/log  (log taken/missed dose)
exports.logDose = async (req, res, next) => {
  try {
    const { scheduledAt, status } = req.body;
    const medication = await Medication.findOne({ _id: req.params.id, user: req.user._id });
    if (!medication) return next(new AppError("Medication not found", 404));

    medication.adherenceLogs.push({
      scheduledAt: new Date(scheduledAt),
      takenAt: status === "taken" ? new Date() : undefined,
      status,
    });
    await medication.save();

    res.status(200).json({ success: true, message: "Dose logged" });
  } catch (error) {
    next(error);
  }
};

// GET /api/medications/today  (today's scheduled doses)
exports.getTodayMedications = async (req, res, next) => {
  try {
    const today = new Date();
    const dayOfWeek = today.toLocaleDateString("en-US", { weekday: "short" }); // e.g. "Mon"

    const medications = await Medication.find({
      user: req.user._id,
      isActive: true,
      startDate: { $lte: today },
      $or: [{ endDate: { $gte: today } }, { endDate: { $exists: false } }],
    });

    const todaySchedule = medications.map((med) => ({
      medication: med,
      times: med.times,
      takenToday: med.adherenceLogs
        .filter((log) => new Date(log.scheduledAt).toDateString() === today.toDateString())
        .map((log) => ({ time: log.scheduledAt, status: log.status })),
    }));

    res.status(200).json({ success: true, todaySchedule });
  } catch (error) {
    next(error);
  }
};

// GET /api/medications/:id/adherence  (adherence stats)
exports.getAdherenceStats = async (req, res, next) => {
  try {
    const medication = await Medication.findOne({ _id: req.params.id, user: req.user._id });
    if (!medication) return next(new AppError("Medication not found", 404));

    const logs = medication.adherenceLogs;
    const total = logs.length;
    const taken = logs.filter((l) => l.status === "taken").length;
    const missed = logs.filter((l) => l.status === "missed").length;
    const adherenceRate = total > 0 ? Math.round((taken / total) * 100) : 0;

    res.status(200).json({ success: true, stats: { total, taken, missed, adherenceRate } });
  } catch (error) {
    next(error);
  }
};