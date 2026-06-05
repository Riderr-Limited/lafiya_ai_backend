const express = require("express");
const router = express.Router();
const emergencyController = require("../controllers/emergency.controller");
const { protect } = require("../middlewares/auth.middleware");

router.get("/contacts", emergencyController.getEmergencyContacts);
router.get("/nearby-hospitals", emergencyController.getNearbyEmergencyHospitals);
router.get("/first-aid/:condition", emergencyController.getFirstAidGuide);
router.post("/alert", protect, emergencyController.sendEmergencyAlert);

module.exports = router;