const Doctor = require("../models/Doctor.model");
const User = require("../models/User.model");
const Appointment = require("../models/Appointment.model");
const AppError = require("../utils/AppError");
const { paginate, getPaginationMeta } = require("../utils/pagination.utils");
const { uploadFile } = require("../utils/cloudinary.utils");

// GET /api/doctors
exports.getAllDoctors = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, specialization, isVerified, language, search } = req.query;
    const filter = {};
    if (specialization) filter.specialization = { $regex: specialization, $options: "i" };
    if (isVerified !== undefined) filter.isVerified = isVerified === "true";
    if (language) filter.languages = { $in: [language] };

    const { skip, limit: lim } = paginate(null, page, limit);

    let userFilter = {};
    if (search) {
      userFilter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
      ];
      const users = await User.find(userFilter).select("_id");
      filter.user = { $in: users.map((u) => u._id) };
    }

    const [doctors, total] = await Promise.all([
      Doctor.find(filter)
        .populate("user", "firstName lastName avatar email phone isVerified")
        .populate("hospital", "name address lga")
        .skip(skip)
        .limit(lim)
        .sort("-rating"),
      Doctor.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      pagination: getPaginationMeta(total, page, lim),
      doctors,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/doctors/:id
exports.getDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate("user", "firstName lastName avatar email phone")
      .populate("hospital", "name address phone");

    if (!doctor) return next(new AppError("Doctor not found", 404));
    res.status(200).json({ success: true, doctor });
  } catch (error) {
    next(error);
  }
};

// POST /api/doctors/register  (doctor registers their profile)
exports.registerDoctorProfile = async (req, res, next) => {
  try {
    const existing = await Doctor.findOne({ user: req.user._id });
    if (existing) return next(new AppError("Doctor profile already exists", 400));

    const {
      specialization, subSpecialization, licenseNumber, mdcnNumber,
      yearsOfExperience, qualifications, bio, languages, consultationFee,
      availability, isAvailableForTelemedicine,
    } = req.body;

    let verificationDocument;
    if (req.file) {
      const result = await uploadFile(req.file.path, "healthcommunity/doctor-docs");
      verificationDocument = result.url;
    }

    const doctor = await Doctor.create({
      user: req.user._id,
      specialization,
      subSpecialization,
      licenseNumber,
      mdcnNumber,
      yearsOfExperience,
      qualifications: qualifications ? JSON.parse(qualifications) : [],
      bio,
      languages: languages ? JSON.parse(languages) : ["en"],
      consultationFee,
      availability: availability ? JSON.parse(availability) : [],
      isAvailableForTelemedicine,
      verificationDocument,
    });

    // Update user role
    await User.findByIdAndUpdate(req.user._id, { role: "doctor" });

    res.status(201).json({ success: true, message: "Doctor profile created. Pending verification.", doctor });
  } catch (error) {
    next(error);
  }
};

// PUT /api/doctors/me
exports.updateMyDoctorProfile = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return next(new AppError("Doctor profile not found", 404));

    const allowed = [
      "bio", "consultationFee", "availability", "languages",
      "isAvailableForTelemedicine", "subSpecialization",
    ];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        doctor[field] = typeof req.body[field] === "string" && field !== "bio"
          ? JSON.parse(req.body[field])
          : req.body[field];
      }
    });

    await doctor.save();
    res.status(200).json({ success: true, message: "Profile updated", doctor });
  } catch (error) {
    next(error);
  }
};

// POST /api/doctors/:id/rate
exports.rateDoctor = async (req, res, next) => {
  try {
    const { rating, review, appointmentId } = req.body;
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return next(new AppError("Doctor not found", 404));

    // Verify patient had an appointment
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patient: req.user._id,
      doctor: doctor._id,
      status: "completed",
    });
    if (!appointment) return next(new AppError("You can only rate doctors after a completed appointment", 403));

    // Update appointment review
    appointment.rating = rating;
    appointment.review = review;
    await appointment.save();

    // Recalculate doctor rating
    const allRatings = await Appointment.find({ doctor: doctor._id, rating: { $exists: true } });
    const avg = allRatings.reduce((sum, a) => sum + a.rating, 0) / allRatings.length;
    doctor.rating = Math.round(avg * 10) / 10;
    doctor.totalRatings = allRatings.length;
    await doctor.save();

    res.status(200).json({ success: true, message: "Rating submitted", newRating: doctor.rating });
  } catch (error) {
    next(error);
  }
};

// GET /api/doctors/:id/availability
exports.getDoctorAvailability = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select("availability isAvailableForTelemedicine");
    if (!doctor) return next(new AppError("Doctor not found", 404));
    res.status(200).json({ success: true, availability: doctor.availability, isAvailableForTelemedicine: doctor.isAvailableForTelemedicine });
  } catch (error) {
    next(error);
  }
};