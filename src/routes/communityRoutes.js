const express = require('express');
const router = express.Router();
const { CommunityGroup, Post } = require('../models/Community');
const { detectMisinformation } = require('../services/aiService');
const { protect, authorize } = require('../middleware/auth');

// GET /api/community/groups
router.get('/groups', protect, async (req, res) => {
  const groups = await CommunityGroup.find({ isActive: true })
    .populate('moderators', 'name role')
    .select('-members');
  res.json({ groups });
});

// POST /api/community/groups — admin only
router.post('/groups', protect, authorize('admin'), async (req, res) => {
  try {
    const group = await CommunityGroup.create({ ...req.body, moderators: [req.user._id] });
    res.status(201).json({ group });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/community/groups/:id/join
router.post('/groups/:id/join', protect, async (req, res) => {
  try {
    const group = await CommunityGroup.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { members: req.user._id } },
      { new: true }
    );
    res.json({ message: 'Joined group', memberCount: group.members.length });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/community/groups/:id/posts
router.get('/groups/:id/posts', protect, async (req, res) => {
  const posts = await Post.find({ group: req.params.id, isMisinformation: false })
    .populate('author', 'name role')
    .populate('verifiedBy', 'name')
    .sort('-createdAt')
    .limit(30);

  const sanitised = posts.map(post => {
    const p = post.toObject();
    if (p.anonymous && req.user.role === 'patient') p.author = { name: 'Anonymous' };
    return p;
  });
  res.json({ posts: sanitised });
});

// POST /api/community/groups/:id/posts
router.post('/groups/:id/posts', protect, async (req, res) => {
  try {
    const { content, language, type, anonymous = false } = req.body;

    const misinfoCheck = await detectMisinformation(content);

    const post = await Post.create({
      group: req.params.id,
      author: req.user._id,
      content,
      language: language || req.user.language,
      type,
      anonymous,
      isMisinformation: misinfoCheck.isMisinformation && misinfoCheck.confidence > 70,
      misinformationNote: misinfoCheck.isMisinformation ? misinfoCheck.reason : undefined,
    });

    res.status(201).json({ post, misinfoCheck });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/community/posts/:id/reply
router.post('/posts/:id/reply', protect, async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          replies: {
            author: req.user._id,
            content: req.body.content,
            isDoctor: req.user.role === 'doctor',
          },
        },
      },
      { new: true }
    ).populate('replies.author', 'name role');
    res.json({ post });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/community/posts/:id/verify — doctor/admin verifies post
router.patch('/posts/:id/verify', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { doctorVerified: true, verifiedBy: req.user._id, isMisinformation: false },
      { new: true }
    );
    res.json({ post });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/community/posts/:id/flag
router.patch('/posts/:id/flag', protect, async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { flaggedBy: req.user._id } },
      { new: true }
    );
    res.json({ flagCount: post.flaggedBy.length });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
