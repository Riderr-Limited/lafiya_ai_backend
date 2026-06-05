const Appointment = require("../models/Appointment.model");
const Doctor = require("../models/Doctor.model");
const User = require("../models/User.model");
const AppError = require("../utils/AppError");
const { paginate, getPaginationMeta } = require("../utils/pagination.utils");
const { createNotification } = require("../utils/notification.utils");
const { sendAppointmentConfirmation } = require("../utils/email.utils");
const { v4: uuidv4 } = require("uuid");

// GET /api/appointments/me  (patient's appointments)
exports.getMyAppointments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = { patient: req.user._id };
    if (status) filter.status = status;

    const { skip, limit: lim } = paginate(null, page, limit);
    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate({ path: "doctor", populate: { path: "user", select: "firstName lastName avatar" } })
        .populate("hospital", "name address")
        .skip(skip).limit(lim).sort("-scheduledAt"),
      Appointment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      pagination: getPaginationMeta(total, page, lim),
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/appointments/doctor  (doctor's appointments)
exports.getDoctorAppointments = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return next(new AppError("Doctor profile not found", 404));

    const { page = 1, limit = 20, status, date } = req.query;
    const filter = { doctor: doctor._id };
    if (status) filter.status = status;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter.scheduledAt = { $gte: start, $lt: end };
    }

    const { skip, limit: lim } = paginate(null, page, limit);
    const [appointments, total] = await Promise.all([
      Appointment.find(filter)
        .populate("patient", "firstName lastName avatar phone dateOfBirth gender")
        .populate("hospital", "name address")
        .skip(skip).limit(lim).sort("scheduledAt"),
      Appointment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      pagination: getPaginationMeta(total, page, lim),
      appointments,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/appointments/:id
exports.getAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate({ path: "doctor", populate: { path: "user", select: "firstName lastName avatar email phone" } })
      .populate("patient", "firstName lastName avatar email phone dateOfBirth gender")
      .populate("hospital", "name address phone");

    if (!appointment) return next(new AppError("Appointment not found", 404));

    const isPatient = appointment.patient._id.toString() === req.user._id.toString();
    const doctor = await Doctor.findById(appointment.doctor._id);
    const isDoctor = doctor?.user.toString() === req.user._id.toString();

    if (!isPatient && !isDoctor && req.user.role !== "admin") {
      return next(new AppError("Not authorized", 403));
    }

    res.status(200).json({ success: true, appointment });
  } catch (error) {
    next(error);
  }
};

// POST /api/appointments
exports.bookAppointment = async (req, res, next) => {
  try {
    const { doctorId, hospitalId, type, scheduledAt, reason, symptoms } = req.body;

    const doctor = await Doctor.findById(doctorId).populate("user", "firstName lastName email fcmToken");
    if (!doctor) return next(new AppError("Doctor not found", 404));
    if (!doctor.isVerified) return next(new AppError("Doctor is not yet verified", 400));

    // Check for appointment conflicts
    const conflictStart = new Date(scheduledAt);
    const conflictEnd = new Date(conflictStart.getTime() + doctor.duration * 60000 || 30 * 60000);
    const conflict = await Appointment.findOne({
      doctor: doctorId,
      status: { $in: ["pending", "confirmed"] },
      scheduledAt: { $gte: conflictStart, $lt: conflictEnd },
    });
    if (conflict) return next(new AppError("Doctor is not available at that time", 409));

    // Generate telemedicine link if needed
    let meetingLink;
    if (type !== "in_person") {
      meetingLink = `${process.env.CLIENT_URL}/consultation/${uuidv4()}`;
    }

    const appointment = await Appointment.create({
      patient: req.user._id,
      doctor: doctorId,
      hospital: hospitalId,
      type,
      scheduledAt,
      reason,
      symptoms: symptoms ? (Array.isArray(symptoms) ? symptoms : symptoms.split(",")) : [],
      fee: doctor.consultationFee,
      meetingLink,
    });

    // Notifications
    const io = req.app.get("io");
    const notif = await createNotification({
      recipient: doctor.user._id,
      sender: req.user._id,
      type: "appointment_confirmed",
      title: "New Appointment Request",
      body: `${req.user.firstName} ${req.user.lastName} booked an appointment with you`,
      link: `/appointments/${appointment._id}`,
    });
    if (io) io.to(`user:${doctor.user._id}`).emit("notification", notif);

    // Email confirmation
    try {
      await sendAppointmentConfirmation(req.user, appointment, doctor);
    } catch (e) {
      console.error("Email error:", e.message);
    }

    res.status(201).json({ success: true, message: "Appointment booked successfully", appointment });
  } catch (error) {
    next(error);
  }
};

// PUT /api/appointments/:id/confirm  (doctor confirms)
exports.confirmAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate("patient", "firstName lastName fcmToken email");
    if (!appointment) return next(new AppError("Appointment not found", 404));

    appointment.status = "confirmed";
    await appointment.save();

    const io = req.app.get("io");
    const notif = await createNotification({
      recipient: appointment.patient._id,
      type: "appointment_confirmed",
      title: "Appointment Confirmed",
      body: `Your appointment on ${new Date(appointment.scheduledAt).toLocaleString()} has been confirmed`,
      link: `/appointments/${appointment._id}`,
    });
    if (io) io.to(`user:${appointment.patient._id}`).emit("notification", notif);

    res.status(200).json({ success: true, message: "Appointment confirmed", appointment });
  } catch (error) {
    next(error);
  }
};

// PUT /api/appointments/:id/cancel
exports.cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return next(new AppError("Appointment not found", 404));

    const isPatient = appointment.patient.toString() === req.user._id.toString();
    const doctor = await Doctor.findById(appointment.doctor);
    const isDoctor = doctor?.user.toString() === req.user._id.toString();

    if (!isPatient && !isDoctor && req.user.role !== "admin") {
      return next(new AppError("Not authorized", 403));
    }

    appointment.status = "cancelled";
    appointment.cancelReason = req.body.reason;
    appointment.cancelledBy = isPatient ? "patient" : "doctor";
    await appointment.save();

    // Notify the other party
    const notifyUser = isPatient ? doctor.user : appointment.patient;
    await createNotification({
      recipient: notifyUser,
      type: "appointment_cancelled",
      title: "Appointment Cancelled",
      body: `An appointment has been cancelled. Reason: ${req.body.reason || "Not specified"}`,
      link: `/appointments/${appointment._id}`,
    });

    res.status(200).json({ success: true, message: "Appointment cancelled", appointment });
  } catch (error) {
    next(error);
  }
};

// PUT /api/appointments/:id/complete  (doctor marks complete)
exports.completeAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return next(new AppError("Appointment not found", 404));

    appointment.status = "completed";
    if (req.body.doctorNotes) appointment.doctorNotes = req.body.doctorNotes;
    if (req.body.prescription) appointment.prescription = req.body.prescription;
    await appointment.save();

    const doctor = await Doctor.findById(appointment.doctor);
    if (doctor) {
      doctor.totalConsultations += 1;
      await doctor.save();
    }

    res.status(200).json({ success: true, message: "Appointment completed", appointment });
  } catch (error) {
    next(error);
  }
};