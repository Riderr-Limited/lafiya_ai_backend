const express = require("express");
const router = express.Router();
const postController = require("../controllers/post.controller");
const { protect, restrictTo, optionalAuth } = require("../middlewares/auth.middleware");
const { upload } = require("../middlewares/upload.middleware");

router.get("/", optionalAuth, postController.getPosts);
router.get("/:id", optionalAuth, postController.getPost);

router.use(protect);
router.post("/", upload.array("media", 5), postController.createPost);
router.put("/:id", postController.updatePost);
router.delete("/:id", postController.deletePost);
router.post("/:id/like", postController.toggleLike);
router.post("/:id/save", postController.toggleSave);
router.post("/:id/flag", postController.flagPost);
router.post("/:id/pin", restrictTo("admin", "moderator", "doctor"), postController.pinPost);

module.exports = router;