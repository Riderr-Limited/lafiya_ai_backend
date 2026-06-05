const User = require("../models/User.model");
const Doctor = require("../models/Doctor.model");
const Hospital = require("../models/Hospital.model");
const Post = require("../models/Post.model");
const Community = require("../models/Community.model");
const Appointment = require("../models/Appointment.model");
const Campaign = require("../models/Campaign.model");
const AppError = require("../utils/AppError");
const { createNotification } = require("../utils/notification.utils");

// GET /api/admin/stats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers, totalDoctors, totalHospitals, totalPosts,
      totalCommunities, totalAppointments, pendingDoctors,
      newUsersThisMonth, flaggedPosts,
    ] = await Promise.all([
      User.countDocuments({ role: "patient" }),
      Doctor.countDocuments(),
      Hospital.countDocuments({ isActive: true }),
      Post.countDocuments(),
      Community.countDocuments({ isActive: true }),
      Appointment.countDocuments(),
      Doctor.countDocuments({ isVerified: false }),
      User.countDocuments({ createdAt: { $gte: new Date(new Date().setDate(1)) } }),
      Post.countDocuments({ flagged: true }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers, totalDoctors, totalHospitals, totalPosts,
        totalCommunities, totalAppointments, pendingDoctors,
        newUsersThisMonth, flaggedPosts,
      },
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/doctors/:doctorId/verify
exports.verifyDoctor = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.doctorId).populate("user", "firstName email fcmToken");
    if (!doctor) return next(new AppError("Doctor not found", 404));

    doctor.isVerified = req.body.isVerified !== false;
    await doctor.save();

    const notif = await createNotification({
      recipient: doctor.user._id,
      type: "system",
      title: doctor.isVerified ? "✅ Profile Verified" : "❌ Verification Rejected",
      body: doctor.isVerified
        ? "Your doctor profile has been verified. You can now manage communities and accept appointments."
        : `Your doctor profile was not verified. Reason: ${req.body.reason || "Please resubmit correct documents"}`,
    });

    const io = req.app.get("io");
    if (io) io.to(`user:${doctor.user._id}`).emit("notification", notif);

    res.status(200).json({ success: true, message: `Doctor ${doctor.isVerified ? "verified" : "rejected"}`, doctor });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/doctors/pending
exports.getPendingDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find({ isVerified: false })
      .populate("user", "firstName lastName email phone")
      .populate("hospital", "name")
      .sort("-createdAt");
    res.status(200).json({ success: true, doctors });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/posts/flagged
exports.getFlaggedPosts = async (req, res, next) => {
  try {
    const posts = await Post.find({ flagged: true })
      .populate("author", "firstName lastName email")
      .populate("community", "name")
      .sort("-createdAt");
    res.status(200).json({ success: true, posts });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/posts/:postId/approve
exports.approvePost = async (req, res, next) => {
  try {
    await Post.findByIdAndUpdate(req.params.postId, { flagged: false, isApproved: true });
    res.status(200).json({ success: true, message: "Post approved" });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/posts/:postId
exports.removePost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.postId);
    if (!post) return next(new AppError("Post not found", 404));

    await createNotification({
      recipient: post.author,
      type: "system",
      title: "Post Removed",
      body: `Your post was removed by an admin. Reason: ${req.body.reason || "Violated community guidelines"}`,
    });

    res.status(200).json({ success: true, message: "Post removed" });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/users/:userId/toggle-active
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return next(new AppError("User not found", 404));
    user.isActive = !user.isActive;
    await user.save();
    res.status(200).json({ success: true, message: `User ${user.isActive ? "activated" : "deactivated"}` });
  } catch (error) {
    next(error);
  }
};

// PUT /api/admin/users/:userId/role
exports.changeUserRole = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { role: req.body.role },
      { new: true, runValidators: true }
    );
    if (!user) return next(new AppError("User not found", 404));
    res.status(200).json({ success: true, message: "User role updated", user });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/activity-logs
exports.getActivityLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const recentPosts = await Post.find()
      .select("author community type createdAt")
      .populate("author", "firstName lastName")
      .populate("community", "name")
      .sort("-createdAt")
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({ success: true, logs: recentPosts });
  } catch (error) {
    next(error);
  }
};