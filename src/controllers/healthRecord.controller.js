const HealthRecord = require("../models/healthRecord.model");
const Doctor = require("../models/Doctor.model");
const AppError = require("../utils/AppError");
const { paginate, getPaginationMeta } = require("../utils/pagination.utils");
const { uploadFile, deleteFile } = require("../utils/cloudinary.utils");

// GET /api/health-records
exports.getMyRecords = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const filter = { user: req.user._id };
    if (type) filter.type = type;

    const { skip, limit: lim } = paginate(null, page, limit);
    const [records, total] = await Promise.all([
      HealthRecord.find(filter)
        .populate("doctor", "specialization")
        .populate("hospital", "name address")
        .skip(skip).limit(lim).sort("-date"),
      HealthRecord.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      pagination: getPaginationMeta(total, page, lim),
      records,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/health-records/:id
exports.getRecord = async (req, res, next) => {
  try {
    const record = await HealthRecord.findById(req.params.id)
      .populate("doctor", "specialization")
      .populate("hospital", "name address");

    if (!record) return next(new AppError("Record not found", 404));
    if (record.user.toString() !== req.user._id.toString()) {
      // Check if a doctor is viewing a shared record
      const doctor = await Doctor.findOne({ user: req.user._id });
      const isShared = doctor && record.sharedWithDoctors.includes(doctor._id);
      if (!isShared && req.user.role !== "admin") {
        return next(new AppError("Not authorized", 403));
      }
    }

    res.status(200).json({ success: true, record });
  } catch (error) {
    next(error);
  }
};

// POST /api/health-records
exports.createRecord = async (req, res, next) => {
  try {
    const { type, title, description, date, doctorId, hospitalId, vitals, tags } = req.body;

    // Handle file uploads
    const files = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadFile(file.path, "healthcommunity/health-records");
        files.push({
          url: result.url,
          publicId: result.publicId,
          name: file.originalname,
          fileType: file.mimetype,
        });
      }
    }

    const record = await HealthRecord.create({
      user: req.user._id,
      type,
      title,
      description,
      date: new Date(date),
      doctor: doctorId || undefined,
      hospital: hospitalId || undefined,
      files,
      vitals: vitals ? JSON.parse(vitals) : undefined,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(",")) : [],
    });

    res.status(201).json({ success: true, message: "Health record created", record });
  } catch (error) {
    next(error);
  }
};

// PUT /api/health-records/:id
exports.updateRecord = async (req, res, next) => {
  try {
    const record = await HealthRecord.findOne({ _id: req.params.id, user: req.user._id });
    if (!record) return next(new AppError("Record not found or not authorized", 404));

    const allowed = ["title", "description", "date", "vitals", "tags"];
    allowed.forEach((f) => {
      if (req.body[f] !== undefined) record[f] = req.body[f];
    });
    await record.save();

    res.status(200).json({ success: true, message: "Record updated", record });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/health-records/:id
exports.deleteRecord = async (req, res, next) => {
  try {
    const record = await HealthRecord.findOne({ _id: req.params.id, user: req.user._id });
    if (!record) return next(new AppError("Record not found or not authorized", 404));

    // Delete files from Cloudinary
    for (const file of record.files) {
      if (file.publicId) await deleteFile(file.publicId).catch(() => {});
    }

    await record.deleteOne();
    res.status(200).json({ success: true, message: "Record deleted" });
  } catch (error) {
    next(error);
  }
};

// POST /api/health-records/:id/share
exports.shareWithDoctor = async (req, res, next) => {
  try {
    const { doctorId } = req.body;
    const record = await HealthRecord.findOne({ _id: req.params.id, user: req.user._id });
    if (!record) return next(new AppError("Record not found", 404));

    record.sharedWithDoctors.addToSet(doctorId);
    record.isSharedWithDoctor = true;
    await record.save();

    res.status(200).json({ success: true, message: "Record shared with doctor" });
  } catch (error) {
    next(error);
  }
};

// GET /api/health-records/patient/:userId  (doctor access to shared records)
exports.getPatientRecords = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return next(new AppError("Doctor profile required", 403));

    const records = await HealthRecord.find({
      user: req.params.userId,
      sharedWithDoctors: doctor._id,
    }).sort("-date");

    res.status(200).json({ success: true, records });
  } catch (error) {
    next(error);
  }
};

// GET /api/health-records/vitals/timeline  (chart data)
exports.getVitalsTimeline = async (req, res, next) => {
  try {
    const records = await HealthRecord.find({
      user: req.user._id,
      type: "vitals",
      "vitals.bloodPressure": { $exists: true },
    }).select("vitals date").sort("date").limit(30);

    res.status(200).json({ success: true, timeline: records });
  } catch (error) {
    next(error);
  }
};