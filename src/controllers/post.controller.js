const Post = require("../models/Post.model");
const Community = require("../models/Community.model");
const User = require("../models/User.model");
const AppError = require("../utils/AppError");
const { paginate, getPaginationMeta } = require("../utils/pagination.utils");
const { uploadFile } = require("../utils/cloudinary.utils");
const { createNotification } = require("../utils/notification.utils");

// GET /api/posts?community=id
exports.getPosts = async (req, res, next) => {
  try {
    const { community, page = 1, limit = 20, type, search } = req.query;
    const filter = { isApproved: true };
    if (community) filter.community = community;
    if (type) filter.type = type;
    if (search) filter.$text = { $search: search };

    const { skip, limit: lim } = paginate(null, page, limit);
    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate("author", "firstName lastName avatar role isVerified isAnonymousMode anonymousName")
        .populate("community", "name category")
        .skip(skip)
        .limit(lim)
        .sort({ isPinned: -1, createdAt: -1 }),
      Post.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      pagination: getPaginationMeta(total, page, lim),
      posts,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/posts/:id
exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate("author", "firstName lastName avatar role isVerified")
      .populate("community", "name category slug");

    if (!post) return next(new AppError("Post not found", 404));
    res.status(200).json({ success: true, post });
  } catch (error) {
    next(error);
  }
};

// POST /api/posts
exports.createPost = async (req, res, next) => {
  try {
    const { communityId, title, content, type, language, tags, isAnonymous, liveSession } = req.body;

    const community = await Community.findById(communityId);
    if (!community) return next(new AppError("Community not found", 404));

    const isMember = community.members.includes(req.user._id);
    if (!isMember && req.user.role !== "admin") {
      return next(new AppError("You must join this community to post", 403));
    }

    // Handle media uploads
    const mediaUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await uploadFile(file.path, "healthcommunity/posts");
        const fileType = file.mimetype.startsWith("image")
          ? "image"
          : file.mimetype.startsWith("video")
          ? "video"
          : file.mimetype.startsWith("audio")
          ? "audio"
          : "document";
        mediaUrls.push({ url: result.url, publicId: result.publicId, type: fileType });
      }
    }

    const isVerifiedDoctorPost = ["doctor", "nurse"].includes(req.user.role);

    const post = await Post.create({
      author: req.user._id,
      community: communityId,
      title,
      content,
      type: type || "text",
      language,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(",")) : [],
      isAnonymous: isAnonymous === "true" || isAnonymous === true,
      anonymousName: isAnonymous ? req.user.anonymousName || "Anonymous" : undefined,
      mediaUrls,
      isVerifiedDoctorPost,
      liveSession: type === "live_session" ? liveSession : undefined,
    });

    // Increment community post count
    await Community.findByIdAndUpdate(communityId, { $inc: { totalPosts: 1 } });

    // Notify community members (limit to 50 for performance)
    const notifyMembers = community.members.slice(0, 50);
    const io = req.app.get("io");
    for (const memberId of notifyMembers) {
      if (memberId.toString() !== req.user._id.toString()) {
        const notification = await createNotification({
          recipient: memberId,
          sender: req.user._id,
          type: "new_post",
          title: `New post in ${community.name}`,
          body: post.title || content.substring(0, 100),
          link: `/communities/${communityId}/posts/${post._id}`,
        });
        if (io) io.to(`user:${memberId}`).emit("notification", notification);
      }
    }

    const populated = await post.populate("author", "firstName lastName avatar role isVerified");
    res.status(201).json({ success: true, message: "Post created", post: populated });
  } catch (error) {
    next(error);
  }
};

// PUT /api/posts/:id
exports.updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return next(new AppError("Post not found", 404));
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return next(new AppError("Not authorized to update this post", 403));
    }

    const { title, content, tags } = req.body;
    if (title) post.title = title;
    if (content) post.content = content;
    if (tags) post.tags = Array.isArray(tags) ? tags : tags.split(",");
    await post.save();

    res.status(200).json({ success: true, message: "Post updated", post });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/posts/:id
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return next(new AppError("Post not found", 404));

    const isOwner = post.author.toString() === req.user._id.toString();
    const community = await Community.findById(post.community);
    const isMod = community?.moderators.some((m) => m.toString() === req.user._id.toString());

    if (!isOwner && !isMod && req.user.role !== "admin") {
      return next(new AppError("Not authorized", 403));
    }

    await post.deleteOne();
    await Community.findByIdAndUpdate(post.community, { $inc: { totalPosts: -1 } });

    res.status(200).json({ success: true, message: "Post deleted" });
  } catch (error) {
    next(error);
  }
};

// POST /api/posts/:id/like
exports.toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return next(new AppError("Post not found", 404));

    const liked = post.likes.includes(req.user._id);
    if (liked) {
      post.likes.pull(req.user._id);
    } else {
      post.likes.push(req.user._id);
      if (post.author.toString() !== req.user._id.toString()) {
        await createNotification({
          recipient: post.author,
          sender: req.user._id,
          type: "like",
          title: "New like on your post",
          body: `Someone liked your post`,
          link: `/posts/${post._id}`,
        });
      }
    }
    post.likeCount = post.likes.length;
    await post.save();

    res.status(200).json({ success: true, liked: !liked, likeCount: post.likeCount });
  } catch (error) {
    next(error);
  }
};

// POST /api/posts/:id/save
exports.toggleSave = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return next(new AppError("Post not found", 404));

    const saved = post.saves.includes(req.user._id);
    if (saved) {
      post.saves.pull(req.user._id);
    } else {
      post.saves.push(req.user._id);
    }
    await post.save();

    res.status(200).json({ success: true, saved: !saved });
  } catch (error) {
    next(error);
  }
};

// POST /api/posts/:id/flag  (report a post)
exports.flagPost = async (req, res, next) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { flagged: true, flagReason: req.body.reason },
      { new: true }
    );
    if (!post) return next(new AppError("Post not found", 404));
    res.status(200).json({ success: true, message: "Post flagged for review" });
  } catch (error) {
    next(error);
  }
};

// POST /api/posts/:id/pin  (moderator)
exports.pinPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return next(new AppError("Post not found", 404));

    await Post.updateMany({ community: post.community, isPinned: true }, { isPinned: false });
    post.isPinned = true;
    await post.save();
    await Community.findByIdAndUpdate(post.community, { pinnedPost: post._id });

    res.status(200).json({ success: true, message: "Post pinned" });
  } catch (error) {
    next(error);
  }
};