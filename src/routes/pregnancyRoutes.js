const express = require('express');
const router = express.Router();
const PregnancyProfile = require('../models/PregnancyProfile');
const pregnancyGuide = require('../data/pregnancyGuide');
const { protect } = require('../middleware/auth');

const calcWeekAndDue = (lmp) => {
  const lmpDate = new Date(lmp);
  const currentWeek = Math.min(40, Math.floor((Date.now() - lmpDate) / (7 * 24 * 60 * 60 * 1000)));
  const dueDate = new Date(lmpDate.getTime() + 280 * 24 * 60 * 60 * 1000);
  return { currentWeek, dueDate };
};

router.post('/', protect, async (req, res) => {
  try {
    const { lastMenstrualPeriod } = req.body;
    const { currentWeek, dueDate } = calcWeekAndDue(lastMenstrualPeriod);
    const profile = await PregnancyProfile.findOneAndUpdate(
      { user: req.user._id },
      { lastMenstrualPeriod, dueDate, currentWeek, active: true },
      { upsert: true, new: true }
    );
    res.status(201).json({ profile });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/', protect, async (req, res) => {
  const profile = await PregnancyProfile.findOne({ user: req.user._id, active: true });
  if (!profile) return res.status(404).json({ message: 'No active pregnancy profile' });
  const weekGuide = pregnancyGuide[profile.currentWeek - 1] || null;
  res.json({ profile, weekGuide });
});

router.get('/week/:weekNumber', protect, async (req, res) => {
  const week = parseInt(req.params.weekNumber);
  if (week < 1 || week > 40) return res.status(400).json({ message: 'Week must be between 1 and 40' });
  res.json({ weekGuide: pregnancyGuide[week - 1] });
});

router.patch('/', protect, async (req, res) => {
  try {
    const { lastMenstrualPeriod } = req.body;
    const { currentWeek, dueDate } = calcWeekAndDue(lastMenstrualPeriod);
    const profile = await PregnancyProfile.findOneAndUpdate(
      { user: req.user._id },
      { lastMenstrualPeriod, dueDate, currentWeek },
      { new: true }
    );
    res.json({ profile });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/', protect, async (req, res) => {
  await PregnancyProfile.findOneAndUpdate({ user: req.user._id }, { active: false });
  res.json({ message: 'Pregnancy profile deactivated' });
});

module.exports = router;
