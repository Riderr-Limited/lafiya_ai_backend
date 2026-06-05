const express = require("express");
const router = express.Router();
const hospitalController = require("../controllers/hospital.controller");
const { protect, restrictTo } = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/upload.middleware");

router.get("/", hospitalController.getAllHospitals);
router.get("/nearby", hospitalController.getNearbyHospitals);
router.get("/:id", hospitalController.getHospital);

router.use(protect);
router.post("/:id/rate", hospitalController.rateHospital);
router.post("/", restrictTo("admin"), upload.array("images", 5), hospitalController.createHospital);
router.put("/:id", restrictTo("admin"), hospitalController.updateHospital);
router.delete("/:id", restrictTo("admin"), hospitalController.deleteHospital);

module.exports = router;