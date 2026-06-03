const express = require('express');
const router = express.Router();
const SymptomCheck = require('../models/SymptomCheck');
const { analyzeSymptoms } = require('../services/aiService');
const { protect, authorize } = require('../middleware/auth');

// POST /api/symptoms/check
router.post('/check', protect, async (req, res) => {
  try {
    const { symptoms, language, patientAge, patientGender, isPregnant } = req.body;

    if (!symptoms?.length) return res.status(400).json({ message: 'Symptoms are required' });

    const aiResponse = await analyzeSymptoms({ symptoms, language, patientAge, patientGender, isPregnant });

    const check = await SymptomCheck.create({
      user: req.user._id,
      symptoms,
      language: language || req.user.language,
      patientAge,
      patientGender,
      isPregnant,
      aiResponse,
    });

    res.status(201).json({ check });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/symptoms/history
router.get('/history', protect, async (req, res) => {
  const checks = await SymptomCheck.find({ user: req.user._id }).sort('-createdAt').limit(20);
  res.json({ checks });
});

// PATCH /api/symptoms/:id/review — doctor reviews a symptom check
router.patch('/:id/review', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const check = await SymptomCheck.findByIdAndUpdate(
      req.params.id,
      { doctorReview: { reviewedBy: req.user._id, notes: req.body.notes, reviewedAt: new Date() } },
      { new: true }
    );
    res.json({ check });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
