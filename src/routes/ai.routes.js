const express = require("express");
const router = express.Router();
const aiController = require("../controllers/ai.controller");
const { protect } = require("../middlewares/auth.middleware");
const rateLimit = require("express-rate-limit");

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: { success: false, message: "Too many AI requests. Please slow down." },
});

router.use(protect);
router.use(aiLimiter);

router.post("/chat", aiController.chat);
router.post("/symptom-check", aiController.symptomCheck);
router.get("/sessions", aiController.getMySessions);
router.get("/sessions/:sessionId", aiController.getSession);
router.delete("/sessions/:sessionId", aiController.deleteSession);

module.exports = router;