const express = require('express');
const router = express.Router();
const { CommunityGroup, Post } = require('../models/Community');
const Medication = require('../models/Medication');
const PregnancyProfile = require('../models/PregnancyProfile');
const pregnancyGuide = require('../data/pregnancyGuide');
const emergencyContacts = require('../data/emergencyContacts');
const { protect } = require('../middleware/auth');

router.get('/essentials', protect, async (req, res) => {
  try {
    const [groups, medications, pregnancyProfile] = await Promise.all([
      CommunityGroup.find({ members: req.user._id, isActive: true }).select('name category description'),
      Medication.find({ user: req.user._id, active: true }),
      PregnancyProfile.findOne({ user: req.user._id, active: true }),
    ]);

    const groupIds = groups.map(g => g._id);
    const recentPosts = await Post.find({ group: { $in: groupIds }, isMisinformation: false })
      .populate('author', 'name role')
      .sort('-createdAt')
      .limit(20);

    let pregnancyWeek = null;
    if (pregnancyProfile) {
      pregnancyWeek = pregnancyGuide[pregnancyProfile.currentWeek - 1] || null;
    }

    res.set('Cache-Control', 'private, max-age=300');
    res.json({ groups, recentPosts, medications, emergencyContacts: emergencyContacts.nigeria, pregnancyWeek });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
