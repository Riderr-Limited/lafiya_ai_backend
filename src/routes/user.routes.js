const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { protect, restrictTo } = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/upload.middleware");

router.use(protect);

router.get("/profile", userController.getMyProfile);
router.put("/profile", userController.updateProfile);
router.put("/avatar", upload.single("avatar"), userController.updateAvatar);
router.delete("/me", userController.deleteMyAccount);
router.get("/me/communities", userController.getMyCommunities);
router.get("/:id", userController.getUserById);
router.get("/", restrictTo("admin"), userController.getAllUsers);

module.exports = router;