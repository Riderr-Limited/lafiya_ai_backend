const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

exports.register = async (req, res) => {
  try {
    const { name, phone, email, password, role, language, location } = req.body;

    const existing = await User.findOne({ phone });
    if (existing) return res.status(400).json({ message: 'Phone already registered' });

    const user = await User.create({ name, phone, email, password, role, language, location });
    const token = signToken(user._id);

    res.status(201).json({ token, user: { id: user._id, name, phone, role, language } });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user._id);
    res.json({ token, user: { id: user._id, name: user.name, phone, role: user.role, language: user.language } });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.getMe = async (req, res) => {
  res.json({ user: req.user });
};

exports.updateProfile = async (req, res) => {
  try {
    const allowed = ['name', 'language', 'location', 'email'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ user });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
