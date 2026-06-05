const Pregnancy = require("../models/Pregnancy.model");
const AppError = require("../utils/AppError");
const { createNotification } = require("../utils/notification.utils");

// Weekly pregnancy milestones data
const WEEKLY_MILESTONES = {
  4: { baby: "Size of a poppy seed. Heart begins to form.", mom: "You may experience light spotting." },
  6: { baby: "Heart is beating. Arm and leg buds forming.", mom: "Morning sickness may begin." },
  8: { baby: "All major organs developing. Fingers forming.", mom: "Fatigue and nausea common." },
  12: { baby: "Baby can open and close fists. Reflexes developing.", mom: "Risk of miscarriage decreases." },
  16: { baby: "Baby can hear sounds. Facial features visible.", mom: "You may start showing." },
  20: { baby: "Halfway there! Baby is the size of a banana.", mom: "Time for anatomy scan ultrasound." },
  24: { baby: "Baby has a chance of survival if born early.", mom: "Glucose screening test due." },
  28: { baby: "Eyes can open. Brain developing rapidly.", mom: "Third trimester begins." },
  32: { baby: "Baby is practising breathing movements.", mom: "Appointments become more frequent." },
  36: { baby: "Baby is considered early term.", mom: "Baby may drop into pelvis." },
  40: { baby: "Full term! Baby is ready to be born.", mom: "Watch for signs of labor." },
};

// GET /api/pregnancy/my
exports.getMyPregnancy = async (req, res, next) => {
  try {
    const pregnancy = await Pregnancy.findOne({ user: req.user._id, isCompleted: false })
      .populate("doctor", "specialization")
      .populate("hospital", "name address");

    if (!pregnancy) return next(new AppError("No active pregnancy record found", 404));

    // Attach current week milestone
    const weekMilestone = WEEKLY_MILESTONES[pregnancy.currentWeek] ||
      WEEKLY_MILESTONES[Object.keys(WEEKLY_MILESTONES).reverse().find((w) => parseInt(w) <= pregnancy.currentWeek)];

    res.status(200).json({ success: true, pregnancy, weekMilestone });
  } catch (error) {
    next(error);
  }
};

// POST /api/pregnancy
exports.startPregnancyTracker = async (req, res, next) => {
  try {
    const existing = await Pregnancy.findOne({ user: req.user._id, isCompleted: false });
    if (existing) return next(new AppError("You already have an active pregnancy record", 400));

    const { lastMenstrualPeriod, doctorId, hospitalId, isHighRisk, riskFactors } = req.body;

    const pregnancy = await Pregnancy.create({
      user: req.user._id,
      lastMenstrualPeriod: new Date(lastMenstrualPeriod),
      doctor: doctorId || undefined,
      hospital: hospitalId || undefined,
      isHighRisk,
      riskFactors: riskFactors ? (Array.isArray(riskFactors) ? riskFactors : riskFactors.split(",")) : [],
    });

    res.status(201).json({ success: true, message: "Pregnancy tracker started", pregnancy });
  } catch (error) {
    next(error);
  }
};

// PUT /api/pregnancy/:id
exports.updatePregnancy = async (req, res, next) => {
  try {
    const pregnancy = await Pregnancy.findOne({ _id: req.params.id, user: req.user._id });
    if (!pregnancy) return next(new AppError("Pregnancy record not found", 404));

    const allowed = ["doctor", "hospital", "isHighRisk", "riskFactors", "birthPlan", "deliveryType", "deliveredAt", "babyWeight", "babyGender"];
    allowed.forEach((f) => { if (req.body[f] !== undefined) pregnancy[f] = req.body[f]; });

    if (req.body.deliveredAt) {
      pregnancy.isCompleted = true;
    }

    await pregnancy.save();
    res.status(200).json({ success: true, message: "Pregnancy record updated", pregnancy });
  } catch (error) {
    next(error);
  }
};

// POST /api/pregnancy/:id/antenatal-visit
exports.addAntenatalVisit = async (req, res, next) => {
  try {
    const pregnancy = await Pregnancy.findOne({ _id: req.params.id, user: req.user._id });
    if (!pregnancy) return next(new AppError("Pregnancy record not found", 404));

    pregnancy.antenatalVisits.push({
      date: new Date(req.body.date),
      week: req.body.week,
      weight: req.body.weight,
      bloodPressure: req.body.bloodPressure,
      fetalHeartRate: req.body.fetalHeartRate,
      fundalHeight: req.body.fundalHeight,
      notes: req.body.notes,
      doctor: req.body.doctorId,
    });

    await pregnancy.save();
    res.status(200).json({ success: true, message: "Antenatal visit recorded", pregnancy });
  } catch (error) {
    next(error);
  }
};

// POST /api/pregnancy/:id/symptom
exports.logSymptom = async (req, res, next) => {
  try {
    const pregnancy = await Pregnancy.findOne({ _id: req.params.id, user: req.user._id });
    if (!pregnancy) return next(new AppError("Pregnancy record not found", 404));

    pregnancy.symptoms.push({
      symptom: req.body.symptom,
      date: new Date(),
      severity: req.body.severity,
    });

    // Alert if severe
    if (req.body.severity === "severe") {
      await createNotification({
        recipient: req.user._id,
        type: "pregnancy_milestone",
        title: "⚠️ Severe Symptom Logged",
        body: `You reported a severe symptom: ${req.body.symptom}. Please consult your doctor immediately.`,
      });
    }

    await pregnancy.save();
    res.status(200).json({ success: true, message: "Symptom logged" });
  } catch (error) {
    next(error);
  }
};

// POST /api/pregnancy/:id/vaccination
exports.addVaccination = async (req, res, next) => {
  try {
    const pregnancy = await Pregnancy.findOne({ _id: req.params.id, user: req.user._id });
    if (!pregnancy) return next(new AppError("Pregnancy record not found", 404));

    pregnancy.vaccinations.push({
      vaccine: req.body.vaccine,
      dateGiven: new Date(req.body.dateGiven),
      nextDue: req.body.nextDue ? new Date(req.body.nextDue) : undefined,
      hospital: req.body.hospital,
    });

    await pregnancy.save();
    res.status(200).json({ success: true, message: "Vaccination recorded" });
  } catch (error) {
    next(error);
  }
};

// GET /api/pregnancy/milestones
exports.getWeeklyMilestones = (req, res) => {
  res.status(200).json({ success: true, milestones: WEEKLY_MILESTONES });
};

// GET /api/pregnancy/history
exports.getPregnancyHistory = async (req, res, next) => {
  try {
    const history = await Pregnancy.find({ user: req.user._id }).sort("-createdAt");
    res.status(200).json({ success: true, history });
  } catch (error) {
    next(error);
  }
};