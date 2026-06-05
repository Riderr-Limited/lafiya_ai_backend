const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { protect, restrictTo } = require("../middlewares/auth.middleware");

router.use(protect, restrictTo("admin"));

router.get("/stats", adminController.getDashboardStats);
router.get("/doctors/pending", adminController.getPendingDoctors);
router.put("/doctors/:doctorId/verify", adminController.verifyDoctor);
router.get("/posts/flagged", adminController.getFlaggedPosts);
router.put("/posts/:postId/approve", adminController.approvePost);
router.delete("/posts/:postId", adminController.removePost);
router.put("/users/:userId/toggle-active", adminController.toggleUserStatus);
router.put("/users/:userId/role", adminController.changeUserRole);
router.get("/activity-logs", adminController.getActivityLogs);

module.exports = router;