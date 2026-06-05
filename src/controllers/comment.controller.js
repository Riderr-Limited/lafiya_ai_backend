const Comment = require("../models/Comment.model");
const Post = require("../models/Post.model");
const AppError = require("../utils/AppError");
const { paginate, getPaginationMeta } = require("../utils/pagination.utils");
const { createNotification } = require("../utils/notification.utils");

// GET /api/comments?post=id
exports.getComments = async (req, res, next) => {
  try {
    const { post, page = 1, limit = 30, parentComment } = req.query;
    if (!post) return next(new AppError("Post ID required", 400));

    const filter = { post, isDeleted: false, parentComment: parentComment || null };
    const { skip, limit: lim } = paginate(null, page, limit);

    const [comments, total] = await Promise.all([
      Comment.find(filter)
        .populate("author", "firstName lastName avatar role isVerified")
        .skip(skip)
        .limit(lim)
        .sort("createdAt"),
      Comment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      pagination: getPaginationMeta(total, page, lim),
      comments,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/comments
exports.createComment = async (req, res, next) => {
  try {
    const { postId, content, parentCommentId, isAnonymous } = req.body;

    const post = await Post.findById(postId);
    if (!post) return next(new AppError("Post not found", 404));

    const comment = await Comment.create({
      post: postId,
      author: req.user._id,
      content,
      parentComment: parentCommentId || null,
      isAnonymous: isAnonymous === true,
      anonymousName: isAnonymous ? req.user.anonymousName || "Anonymous" : undefined,
      isVerifiedDoctorComment: ["doctor", "nurse"].includes(req.user.role),
    });

    await Post.findByIdAndUpdate(postId, { $inc: { commentCount: 1 } });

    // Notify post author
    if (post.author.toString() !== req.user._id.toString()) {
      await createNotification({
        recipient: post.author,
        sender: req.user._id,
        type: "new_comment",
        title: "New comment on your post",
        body: content.substring(0, 100),
        link: `/posts/${postId}`,
      });
    }

    const populated = await comment.populate("author", "firstName lastName avatar role isVerified");
    res.status(201).json({ success: true, message: "Comment added", comment: populated });
  } catch (error) {
    next(error);
  }
};

// PUT /api/comments/:id
exports.updateComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return next(new AppError("Comment not found", 404));
    if (comment.author.toString() !== req.user._id.toString()) {
      return next(new AppError("Not authorized", 403));
    }
    comment.content = req.body.content;
    await comment.save();
    res.status(200).json({ success: true, message: "Comment updated", comment });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/comments/:id
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return next(new AppError("Comment not found", 404));

    const isOwner = comment.author.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin" && req.user.role !== "moderator") {
      return next(new AppError("Not authorized", 403));
    }

    comment.isDeleted = true;
    comment.content = "[Deleted]";
    await comment.save();

    await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });

    res.status(200).json({ success: true, message: "Comment deleted" });
  } catch (error) {
    next(error);
  }
};

// POST /api/comments/:id/like
exports.toggleLike = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return next(new AppError("Comment not found", 404));

    const liked = comment.likes.includes(req.user._id);
    if (liked) comment.likes.pull(req.user._id);
    else comment.likes.push(req.user._id);
    comment.likeCount = comment.likes.length;
    await comment.save();

    res.status(200).json({ success: true, liked: !liked, likeCount: comment.likeCount });
  } catch (error) {
    next(error);
  }
};