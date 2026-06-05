const express = require("express");
const router = express.Router();
const pregnancyController = require("../controllers/pregnancy.controller");
const { protect } = require("../middlewares/auth.middleware");

router.get("/milestones", pregnancyController.getWeeklyMilestones);

router.use(protect);

router.get("/my", pregnancyController.getMyPregnancy);
router.get("/history", pregnancyController.getPregnancyHistory);
router.post("/", pregnancyController.startPregnancyTracker);
router.put("/:id", pregnancyController.updatePregnancy);
router.post("/:id/antenatal-visit", pregnancyController.addAntenatalVisit);
router.post("/:id/symptom", pregnancyController.logSymptom);
router.post("/:id/vaccination", pregnancyController.addVaccination);

module.exports = router;