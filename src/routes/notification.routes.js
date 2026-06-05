const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { protect } = require("../middlewares/auth.middleware");

router.use(protect);

router.get("/", notificationController.getMyNotifications);
router.put("/read-all", notificationController.markAllAsRead);
router.delete("/clear-all", notificationController.clearAllNotifications);
router.put("/:id/read", notificationController.markAsRead);
router.delete("/:id", notificationController.deleteNotification);

module.exports = router;