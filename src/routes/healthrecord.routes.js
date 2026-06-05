const express = require("express");
const router = express.Router();
const healthRecordController = require("../controllers/healthRecord.controller");
const { protect, restrictTo } = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/upload.middleware");

router.use(protect);

router.get("/", healthRecordController.getMyRecords);
router.get("/vitals/timeline", healthRecordController.getVitalsTimeline);
router.get("/patient/:userId", restrictTo("doctor", "admin"), healthRecordController.getPatientRecords);
router.get("/:id", healthRecordController.getRecord);
router.post("/", upload.array("files", 5), healthRecordController.createRecord);
router.put("/:id", healthRecordController.updateRecord);
router.delete("/:id", healthRecordController.deleteRecord);
router.post("/:id/share", healthRecordController.shareWithDoctor);

module.exports = router;