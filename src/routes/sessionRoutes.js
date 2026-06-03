const express = require('express');
const router = express.Router();
const LiveSession = require('../models/LiveSession');
const { CommunityGroup } = require('../models/Community');
const { notify } = require('../services/notificationService');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const session = await LiveSession.create({ ...req.body, doctor: req.user._id });

    // Notify group members if session is linked to a group
    if (session.group) {
      const group = await CommunityGroup.findById(session.group).select('members');
      if (group) {
        await Promise.all(
          group.members.map(memberId =>
            notify(memberId, 'new_session', `📡 New Live Session: ${session.title}`, `Scheduled for ${new Date(session.scheduledAt).toLocaleString()}`, { sessionId: String(session._id) })
          )
        );
      }
    }

    res.status(201).json({ session });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/', protect, async (req, res) => {
  const { group, language, upcoming } = req.query;
  const query = {};
  if (group) query.group = group;
  if (language) query.language = language;
  if (upcoming === 'true') query.scheduledAt = { $gte: new Date() };

  const sessions = await LiveSession.find(query)
    .populate('doctor', 'name doctorProfile.specialization')
    .populate('group', 'name')
    .sort('scheduledAt');
  res.json({ sessions });
});

router.get('/:id', protect, async (req, res) => {
  const session = await LiveSession.findById(req.params.id)
    .populate('doctor', 'name doctorProfile.specialization')
    .populate('group', 'name');
  if (!session) return res.status(404).json({ message: 'Session not found' });
  res.json({ session });
});

router.patch('/:id/status', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const session = await LiveSession.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json({ session });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', protect, authorize('doctor', 'admin'), async (req, res) => {
  await LiveSession.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
  res.json({ message: 'Session cancelled' });
});

module.exports = router;
