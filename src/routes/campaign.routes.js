const express = require("express");
const router = express.Router();
const campaignController = require("../controllers/campaign.controller");
const { protect, restrictTo } = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/upload.middleware");

router.get("/", campaignController.getAllCampaigns);
router.get("/:id", campaignController.getCampaign);

router.use(protect);
router.post("/", restrictTo("admin", "doctor"), upload.single("coverImage"), campaignController.createCampaign);
router.put("/:id/publish", restrictTo("admin"), campaignController.publishCampaign);
router.delete("/:id", restrictTo("admin"), campaignController.deleteCampaign);

module.exports = router;