const express = require("express");
const router = express.Router();
const doctorController = require("../controllers/doctor.controller");
const { protect, restrictTo } = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/upload.middleware");

router.get("/", doctorController.getAllDoctors);
router.get("/:id", doctorController.getDoctor);
router.get("/:id/availability", doctorController.getDoctorAvailability);

router.use(protect);
router.post("/register", upload.single("verificationDocument"), doctorController.registerDoctorProfile);
router.put("/me", doctorController.updateMyDoctorProfile);
router.post("/:id/rate", doctorController.rateDoctor);

module.exports = router;