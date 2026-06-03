const multer = require('multer');
const { Readable } = require('stream');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set in .env');
  const OpenAI = require('openai');
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

exports.transcribeAudio = [
  upload.single('audio'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'Audio file required' });
      const openai = getOpenAI();
      const { language = 'hausa' } = req.body;
      const file = new File([req.file.buffer], req.file.originalname, { type: req.file.mimetype });

      const transcription = await openai.audio.transcriptions.create({
        file,
        model: 'whisper-1',
        language: language === 'hausa' ? 'ha' : 'en',
      });

      res.json({ text: transcription.text, language });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
];

exports.synthesizeSpeech = async (req, res) => {
  try {
    const { text, language = 'hausa' } = req.body;
    if (!text) return res.status(400).json({ message: 'Text is required' });
    const openai = getOpenAI();

    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: language === 'hausa' ? `[Hausa] ${text}` : text,
    });

    res.set('Content-Type', 'audio/mpeg');
    const buffer = Buffer.from(await response.arrayBuffer());
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
