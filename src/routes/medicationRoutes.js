const express = require('express');
const router = express.Router();
const Medication = require('../models/Medication');
const { protect } = require('../middleware/auth');

router.post('/', protect, async (req, res) => {
  try {
    const med = await Medication.create({ ...req.body, user: req.user._id });
    res.status(201).json({ medication: med });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/', protect, async (req, res) => {
  const meds = await Medication.find({ user: req.user._id, active: true }).sort('-createdAt');
  res.json({ medications: meds });
});

router.patch('/:id', protect, async (req, res) => {
  try {
    const med = await Medication.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!med) return res.status(404).json({ message: 'Not found' });
    res.json({ medication: med });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    await Medication.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { active: false });
    res.json({ message: 'Medication deactivated' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
