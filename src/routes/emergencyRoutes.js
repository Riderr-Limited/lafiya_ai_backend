const express = require('express');
const router = express.Router();
const Hospital = require('../models/Hospital');
const EmergencyAlert = require('../models/EmergencyAlert');
const { CommunityGroup } = require('../models/Community');
const { notify } = require('../services/notificationService');
const User = require('../models/User');
const emergencyContacts = require('../data/emergencyContacts');
const { protect } = require('../middleware/auth');

// GET /api/emergency?lat=&lng=
router.get('/', protect, async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const query = { isVerified: true, hasEmergency: true };

    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: 50000, // 50km
        },
      };
    }

    const hospitals = await Hospital.find(query).limit(3).select('name address phone type location');
    res.json({ emergencyContacts: emergencyContacts.nigeria, hospitals });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/emergency/alert
router.post('/alert', protect, async (req, res) => {
  try {
    const { lat, lng, message } = req.body;

    const alert = await EmergencyAlert.create({ user: req.user._id, location: { lat, lng }, message });

    // Notify doctors in all groups the patient is a member of
    const groups = await CommunityGroup.find({ members: req.user._id }).select('moderators');
    const doctorIds = [...new Set(groups.flatMap(g => g.moderators.map(String)))];

    await Promise.all(
      doctorIds.map(id =>
        notify(id, 'general', '🚨 Emergency Alert', `${req.user.name} needs urgent help: ${message}`, { alertId: String(alert._id) })
      )
    );

    res.status(201).json({ alert, notifiedDoctors: doctorIds.length });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
