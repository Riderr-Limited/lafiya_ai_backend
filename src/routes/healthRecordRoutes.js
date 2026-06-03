const express = require('express');
const router = express.Router();
const HealthRecord = require('../models/HealthRecord');
const { upload } = require('../config/cloudinary');
const { protect, authorize } = require('../middleware/auth');

// POST /api/health-records/upload
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    const record = await HealthRecord.create({
      user: req.user._id,
      type: req.body.type,
      title: req.body.title,
      notes: req.body.notes,
      fileUrl: req.file.path,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
    });
    res.status(201).json({ record });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/health-records/shared-with-me — doctor only
router.get('/shared-with-me', protect, authorize('doctor', 'admin'), async (req, res) => {
  const records = await HealthRecord.find({
    sharedWithDoctors: req.user._id,
    isDeleted: false,
  }).populate('user', 'name phone');
  res.json({ records });
});

// GET /api/health-records
router.get('/', protect, async (req, res) => {
  const query = { user: req.user._id, isDeleted: false };
  if (req.query.type) query.type = req.query.type;
  const records = await HealthRecord.find(query).sort('-date');
  res.json({ records });
});

// GET /api/health-records/:id
router.get('/:id', protect, async (req, res) => {
  const record = await HealthRecord.findOne({ _id: req.params.id, user: req.user._id, isDeleted: false });
  if (!record) return res.status(404).json({ message: 'Not found' });
  res.json({ record });
});

// PATCH /api/health-records/:id/share
router.patch('/:id/share', protect, async (req, res) => {
  try {
    const record = await HealthRecord.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $addToSet: { sharedWithDoctors: req.body.doctorId } },
      { new: true }
    );
    if (!record) return res.status(404).json({ message: 'Not found' });
    res.json({ record });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/health-records/:id
router.delete('/:id', protect, async (req, res) => {
  await HealthRecord.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isDeleted: true });
  res.json({ message: 'Record deleted' });
});

module.exports = router;
