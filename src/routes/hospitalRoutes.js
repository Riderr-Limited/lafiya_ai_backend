const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');
const { protect, authorize } = require('../middleware/auth');

// GET /api/hospitals?lat=&lng=&radius=&type=&emergency=
router.get('/', protect, async (req, res) => {
  try {
    const { lat, lng, radius = 10000, type, emergency } = req.query;
    const query = { isVerified: true };

    if (type) query.type = type;
    if (emergency === 'true') query.hasEmergency = true;

    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseInt(radius),
        },
      };
    }

    const hospitals = await Hospital.find(query).limit(20);
    res.json({ hospitals });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/hospitals/:id
router.get('/:id', protect, async (req, res) => {
  const hospital = await Hospital.findById(req.params.id);
  if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
  res.json({ hospital });
});

// POST /api/hospitals — admin only
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const hospital = await Hospital.create(req.body);
    res.status(201).json({ hospital });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH /api/hospitals/:id — admin only
router.patch('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ hospital });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
