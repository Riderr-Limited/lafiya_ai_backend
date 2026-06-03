const express = require('express');
const router = express.Router();
const { transcribeAudio, synthesizeSpeech } = require('../controllers/voiceController');
const { protect } = require('../middleware/auth');

router.post('/transcribe', protect, transcribeAudio);
router.post('/speak', protect, synthesizeSpeech);

module.exports = router;
