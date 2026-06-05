const express = require("express");
const router = express.Router();
const medicationController = require("../controllers/medication.controller");
const { protect } = require("../middlewares/auth.middleware");

router.use(protect);

router.get("/", medicationController.getMyMedications);
router.get("/today", medicationController.getTodayMedications);
router.get("/:id", medicationController.getMedication);
router.get("/:id/adherence", medicationController.getAdherenceStats);
router.post("/", medicationController.createMedication);
router.put("/:id", medicationController.updateMedication);
router.delete("/:id", medicationController.deleteMedication);
router.post("/:id/log", medicationController.logDose);

module.exports = router;