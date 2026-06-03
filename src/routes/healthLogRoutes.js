const express = require('express');
const router = express.Router();
const HealthLog = require('../models/HealthLog');
const { protect } = require('../middleware/auth');

router.post('/', protect, async (req, res) => {
  try {
    const log = await HealthLog.create({ ...req.body, user: req.user._id });
    res.status(201).json({ log });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/summary', protect, async (req, res) => {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const logs = await HealthLog.find({ user: req.user._id, date: { $gte: since } });

  const numericFields = ['bloodSugar', 'weight', 'temperature', 'heartRate'];
  const summary = {};

  for (const field of numericFields) {
    const values = logs.map(l => l.metrics?.[field]).filter(v => v != null);
    if (values.length) {
      summary[field] = {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)),
        count: values.length,
      };
    }
  }

  res.json({ summary, totalLogs: logs.length });
});

router.get('/', protect, async (req, res) => {
  const { from, to } = req.query;
  const query = { user: req.user._id };
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }
  const logs = await HealthLog.find(query).sort('-date');
  res.json({ logs });
});

router.get('/:id', protect, async (req, res) => {
  const log = await HealthLog.findOne({ _id: req.params.id, user: req.user._id });
  if (!log) return res.status(404).json({ message: 'Not found' });
  res.json({ log });
});

router.delete('/:id', protect, async (req, res) => {
  await HealthLog.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ message: 'Log deleted' });
});

module.exports = router;
