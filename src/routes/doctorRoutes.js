const express = require('express');
const router = express.Router();
const User = require('../models/User');
const specialisationMap = require('../utils/specialisationMap');
const { protect, authorize } = require('../middleware/auth');

// GET /api/doctors
router.get('/', protect, async (req, res) => {
  const { specialization, state } = req.query;
  const query = { role: 'doctor', 'doctorProfile.isVerified': true, isActive: true };
  if (specialization) query['doctorProfile.specialization'] = specialization;
  if (state) query['location.state'] = state;

  const doctors = await User.find(query).select('name location doctorProfile.specialization doctorProfile.trustScore rating reviewCount availableForConsultation');
  res.json({ doctors });
});

// POST /api/doctors/match
router.post('/match', protect, async (req, res) => {
  try {
    const { condition = '', symptoms = [] } = req.body;
    const text = `${condition} ${symptoms.join(' ')}`.toLowerCase();

    const matched = Object.keys(specialisationMap).find(key => key !== 'default' && text.includes(key));
    const specialization = specialisationMap[matched] || specialisationMap['default'];

    const doctors = await User.find({
      role: 'doctor',
      'doctorProfile.isVerified': true,
      'doctorProfile.specialization': specialization,
      availableForConsultation: true,
      isActive: true,
    })
      .select('name location doctorProfile.specialization rating reviewCount')
      .sort('-rating')
      .limit(5);

    res.json({ specialization, doctors });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/doctors/:id/review
router.post('/:id/review', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be 1-5' });

    const doctor = await User.findById(req.params.id);
    if (!doctor || doctor.role !== 'doctor') return res.status(404).json({ message: 'Doctor not found' });

    const newCount = doctor.reviewCount + 1;
    const newRating = parseFloat(((doctor.rating * doctor.reviewCount + rating) / newCount).toFixed(2));

    await User.findByIdAndUpdate(req.params.id, { rating: newRating, reviewCount: newCount });
    res.json({ message: 'Review submitted', rating: newRating, reviewCount: newCount });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/doctors/:id/verify
router.patch('/:id/verify', protect, authorize('admin'), async (req, res) => {
  try {
    const doctor = await User.findByIdAndUpdate(
      req.params.id,
      { 'doctorProfile.isVerified': true },
      { new: true }
    ).select('-password');
    res.json({ doctor });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/doctors/profile
router.patch('/profile', protect, authorize('doctor'), async (req, res) => {
  try {
    const { specialization, licenseNumber, hospital } = req.body;
    const doctor = await User.findByIdAndUpdate(
      req.user._id,
      { 'doctorProfile.specialization': specialization, 'doctorProfile.licenseNumber': licenseNumber, 'doctorProfile.hospital': hospital },
      { new: true }
    ).select('-password');
    res.json({ doctor });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
