const express = require("express");
const router = express.Router();
const commentController = require("../controllers/comment.controller");
const { protect } = require("../middlewares/auth.middleware");

router.get("/", protect, commentController.getComments);
router.post("/", protect, commentController.createComment);
router.put("/:id", protect, commentController.updateComment);
router.delete("/:id", protect, commentController.deleteComment);
router.post("/:id/like", protect, commentController.toggleLike);

module.exports = router;