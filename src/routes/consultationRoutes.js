const express = require('express');
const router = express.Router();
const Consultation = require('../models/Consultation');
const { notify } = require('../services/notificationService');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, async (req, res) => {
  try {
    const { doctorId, scheduledAt, type, reason, attachedRecords } = req.body;
    const consultation = await Consultation.create({
      patient: req.user._id,
      doctor: doctorId,
      scheduledAt,
      type,
      reason,
      attachedRecords,
    });
    await notify(doctorId, 'consultation_update', 'New Consultation Request', `${req.user.name} has requested a ${type} consultation`, { consultationId: String(consultation._id) });
    res.status(201).json({ consultation });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/', protect, async (req, res) => {
  const query = req.user.role === 'doctor'
    ? { doctor: req.user._id }
    : { patient: req.user._id };
  const consultations = await Consultation.find(query)
    .populate('patient doctor', 'name phone role')
    .sort('-createdAt');
  res.json({ consultations });
});

router.get('/:id', protect, async (req, res) => {
  const c = await Consultation.findById(req.params.id).populate('patient doctor', 'name phone role');
  if (!c) return res.status(404).json({ message: 'Not found' });
  res.json({ consultation: c });
});

router.patch('/:id/confirm', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const c = await Consultation.findByIdAndUpdate(
      req.params.id,
      { status: 'confirmed', meetingLink: req.body.meetingLink, scheduledAt: req.body.scheduledAt },
      { new: true }
    );
    await notify(c.patient, 'consultation_update', 'Consultation Confirmed', `Your consultation has been confirmed. Join: ${c.meetingLink}`, { consultationId: String(c._id) });
    res.json({ consultation: c });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch('/:id/reject', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const c = await Consultation.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
    await notify(c.patient, 'consultation_update', 'Consultation Rejected', 'Your consultation request was not accepted.', { consultationId: String(c._id) });
    res.json({ consultation: c });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch('/:id/complete', protect, authorize('doctor', 'admin'), async (req, res) => {
  try {
    const c = await Consultation.findByIdAndUpdate(
      req.params.id,
      { status: 'completed', notes: req.body.notes },
      { new: true }
    );
    res.json({ consultation: c });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.patch('/:id/cancel', protect, async (req, res) => {
  try {
    const c = await Consultation.findById(req.params.id);
    if (!c) return res.status(404).json({ message: 'Not found' });
    const isOwner = String(c.patient) === String(req.user._id) || String(c.doctor) === String(req.user._id);
    if (!isOwner) return res.status(403).json({ message: 'Access denied' });
    c.status = 'cancelled';
    await c.save();
    res.json({ consultation: c });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
