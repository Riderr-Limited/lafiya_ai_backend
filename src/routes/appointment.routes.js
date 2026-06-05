const express = require("express");
const router = express.Router();
const appointmentController = require("../controllers/appointment.controller");
const { protect, restrictTo } = require("../middlewares/auth.middleware");

router.use(protect);

router.get("/me", appointmentController.getMyAppointments);
router.get("/doctor", restrictTo("doctor", "admin"), appointmentController.getDoctorAppointments);
router.get("/:id", appointmentController.getAppointment);
router.post("/", appointmentController.bookAppointment);
router.put("/:id/confirm", restrictTo("doctor", "admin"), appointmentController.confirmAppointment);
router.put("/:id/cancel", appointmentController.cancelAppointment);
router.put("/:id/complete", restrictTo("doctor", "admin"), appointmentController.completeAppointment);

module.exports = router;