const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const { CommunityGroup } = require('../models/Community');
const { sendMulticast, createNotification } = require('../services/notificationService');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const campaign = await Campaign.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ campaign });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/', protect, async (req, res) => {
  const campaigns = await Campaign.find({ status: 'sent' })
    .populate('createdBy', 'name')
    .sort('-sentAt');
  res.json({ campaigns });
});

router.get('/:id', protect, async (req, res) => {
  const campaign = await Campaign.findById(req.params.id).populate('createdBy', 'name');
  if (!campaign) return res.status(404).json({ message: 'Not found' });
  res.json({ campaign });
});

router.post('/:id/send', protect, authorize('admin'), async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Not found' });
    if (campaign.status === 'sent') return res.status(400).json({ message: 'Already sent' });

    // Get target users
    let users;
    if (campaign.targetGroup) {
      const group = await CommunityGroup.findById(campaign.targetGroup).select('members');
      users = await User.find({ _id: { $in: group.members }, fcmToken: { $exists: true } }).select('fcmToken _id');
    } else {
      users = await User.find({ isActive: true, fcmToken: { $exists: true } }).select('fcmToken _id');
    }

    const tokens = users.map(u => u.fcmToken).filter(Boolean);
    await sendMulticast(tokens, campaign.title, campaign.body, { campaignId: String(campaign._id) });

    // Save notifications in DB
    await Promise.all(users.map(u => createNotification(u._id, 'general', campaign.title, campaign.body, { campaignId: String(campaign._id) })));

    await Campaign.findByIdAndUpdate(campaign._id, { status: 'sent', sentAt: new Date() });
    res.json({ message: `Campaign sent to ${users.length} users` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  const campaign = await Campaign.findById(req.params.id);
  if (!campaign) return res.status(404).json({ message: 'Not found' });
  if (campaign.status === 'sent') return res.status(400).json({ message: 'Cannot delete a sent campaign' });
  await campaign.deleteOne();
  res.json({ message: 'Campaign deleted' });
});

module.exports = router;
