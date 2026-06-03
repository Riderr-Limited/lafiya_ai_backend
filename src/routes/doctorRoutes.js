const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// GET /api/doctors — list verified doctors
router.get('/', protect, async (req, res) => {
  const { specialization, state } = req.query;
  const query = { role: 'doctor', 'doctorProfile.isVerified': true, isActive: true };
  if (specialization) query['doctorProfile.specialization'] = specialization;
  if (state) query['location.state'] = state;

  const doctors = await User.find(query).select('name location doctorProfile.specialization doctorProfile.trustScore');
  res.json({ doctors });
});

// PATCH /api/doctors/:id/verify — admin verifies doctor
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

// PATCH /api/doctors/profile — doctor updates own profile
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
