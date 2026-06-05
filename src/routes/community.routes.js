const express = require("express");
const router = express.Router();
const communityController = require("../controllers/community.controller");
const { protect, restrictTo } = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/upload.middleware");

router.get("/", communityController.getAllCommunities);
router.get("/:id", communityController.getCommunity);
router.get("/:id/members", protect, communityController.getCommunityMembers);

router.use(protect);
router.post("/", restrictTo("admin", "moderator"), upload.single("coverImage"), communityController.createCommunity);
router.put("/:id", upload.single("coverImage"), communityController.updateCommunity);
router.post("/:id/join", communityController.joinCommunity);
router.post("/:id/leave", communityController.leaveCommunity);
router.post("/:id/add-doctor", restrictTo("admin"), communityController.addDoctorToCommunity);

module.exports = router;