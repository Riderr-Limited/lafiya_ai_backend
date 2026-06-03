const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile } = require('./auth');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateProfile);

module.exports = router;
