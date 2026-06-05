const Notification = require("../models/Notification.model");
const AppError = require("../utils/AppError");
const { paginate, getPaginationMeta } = require("../utils/pagination.utils");

// GET /api/notifications
exports.getMyNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isRead } = req.query;
    const filter = { recipient: req.user._id };
    if (isRead !== undefined) filter.isRead = isRead === "true";

    const { skip, limit: lim } = paginate(null, page, limit);
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .populate("sender", "firstName lastName avatar")
        .skip(skip).limit(lim).sort("-createdAt"),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);

    res.status(200).json({
      success: true,
      pagination: getPaginationMeta(total, page, lim),
      unreadCount,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/notifications/:id/read
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true, readAt: Date.now() },
      { new: true }
    );
    if (!notification) return next(new AppError("Notification not found", 404));
    res.status(200).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

// PUT /api/notifications/read-all
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true, readAt: Date.now() }
    );
    res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res, next) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
    res.status(200).json({ success: true, message: "Notification deleted" });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/notifications/clear-all
exports.clearAllNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });
    res.status(200).json({ success: true, message: "All notifications cleared" });
  } catch (error) {
    next(error);
  }
};