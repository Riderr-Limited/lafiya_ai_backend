const express = require('express');
const router = express.Router();
const Content = require('../models/Content');
const { protect, authorize } = require('../middleware/auth');

// GET /api/content?category=&language=
router.get('/', protect, async (req, res) => {
  const { category, language, page = 1, limit = 10 } = req.query;
  const query = { isPublished: true, isVerified: true };
  if (category) query.category = category;

  const contents = await Content.find(query)
    .populate('author', 'name role')
    .sort('-trustScore -createdAt')
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  res.json({ contents });
});

// GET /api/content/:id
router.get('/:id', protect, async (req, res) => {
  const content = await Content.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  ).populate('author verifiedBy', 'name role');
  if (!content) return res.status(404).json({ message: 'Content not found' });
  res.json({ content });
});

// POST /api/content — doctor or admin
router.post('/', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const content = await Content.create({ ...req.body, author: req.user._id });
    res.status(201).json({ content });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/content/:id/verify — admin only
router.patch('/:id/verify', protect, authorize('admin'), async (req, res) => {
  try {
    const content = await Content.findByIdAndUpdate(
      req.params.id,
      {
        isVerified: true,
        verifiedBy: req.user._id,
        verifiedAt: new Date(),
        isPublished: true,
        trustScore: req.body.trustScore || 80,
      },
      { new: true }
    );
    res.json({ content });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/content/:id — author or admin
router.patch('/:id', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const content = await Content.findOneAndUpdate(
      { _id: req.params.id, author: req.user._id },
      req.body,
      { new: true }
    );
    if (!content) return res.status(404).json({ message: 'Not found or unauthorized' });
    res.json({ content });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
