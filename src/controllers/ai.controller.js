const AISession = require("../models/AISession.model");
const Hospital = require("../models/Hospital.model");
const Doctor = require("../models/Doctor.model");
const AppError = require("../utils/AppError");
const { v4: uuidv4 } = require("uuid");

// Build system prompt based on user profile and context
const buildSystemPrompt = (user, language = "en") => {
  const langInstruction =
    language === "ha"
      ? "Respond primarily in Hausa (Harshen Hausa). Use simple, clear language."
      : "Respond in clear, simple English. Use easy-to-understand language for patients.";

  return `You are a compassionate AI health assistant for HealthCommunity, a platform serving patients in Kano and Northern Nigeria.

${langInstruction}

Your responsibilities:
- Help users understand their symptoms and health concerns
- Provide basic health education and guidance
- Identify emergency warning signs and urge hospital visits when needed
- Support pregnant women with maternal health guidance
- Remind users about medication adherence
- Recommend appropriate types of doctors based on symptoms
- Provide culturally sensitive healthcare advice for Northern Nigeria

IMPORTANT RULES:
1. NEVER diagnose diseases definitively — always recommend seeing a doctor
2. For emergencies (chest pain, difficulty breathing, stroke signs, severe bleeding, high fever in children), ALWAYS recommend going to the hospital immediately
3. Be empathetic and patient with users
4. Account for common conditions in Northern Nigeria: malaria, typhoid, hypertension, diabetes, sickle cell
5. Respect cultural and religious sensitivities
6. Always end responses with a recommendation to consult a qualified doctor

User profile: ${user.firstName}, ${user.gender || "unknown gender"}, conditions: ${user.healthConditions?.join(", ") || "none specified"}.

You are NOT a replacement for medical professionals.`;
};

// POST /api/ai/chat
exports.chat = async (req, res, next) => {
  try {
    const { message, sessionId, language, inputType = "text" } = req.body;
    if (!message) return next(new AppError("Message is required", 400));

    // Find or create session
    let session = sessionId
      ? await AISession.findOne({ sessionId, user: req.user._id })
      : null;

    if (!session) {
      session = await AISession.create({
        user: req.user._id,
        sessionId: uuidv4(),
        context: "general",
        messages: [],
      });
    }

    // Add user message
    session.messages.push({
      role: "user",
      content: message,
      language: language || req.user.preferredLanguage || "en",
      inputType,
    });

    // Build messages for OpenAI
    const conversationMessages = session.messages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Call OpenAI
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: buildSystemPrompt(req.user, language) },
          ...conversationMessages,
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const err = await openaiResponse.json();
      throw new Error(err.error?.message || "AI service error");
    }

    const aiData = await openaiResponse.json();
    const aiReply = aiData.choices[0].message.content;

    // Detect urgency
    const urgencyKeywords = {
      emergency: ["chest pain", "cannot breathe", "stroke", "unconscious", "severe bleeding", "convulsion"],
      high: ["high fever", "vomiting blood", "severe pain", "difficulty breathing"],
      moderate: ["fever", "persistent pain", "dizziness", "swelling"],
    };

    let urgencyLevel = "low";
    const lowerMessage = message.toLowerCase();
    if (urgencyKeywords.emergency.some((kw) => lowerMessage.includes(kw))) urgencyLevel = "emergency";
    else if (urgencyKeywords.high.some((kw) => lowerMessage.includes(kw))) urgencyLevel = "high";
    else if (urgencyKeywords.moderate.some((kw) => lowerMessage.includes(kw))) urgencyLevel = "moderate";

    // Add assistant reply
    session.messages.push({
      role: "assistant",
      content: aiReply,
      language: language || "en",
    });
    session.urgencyLevel = urgencyLevel;

    // Auto-recommend nearby hospital for emergencies
    let recommendedHospital = null;
    if (urgencyLevel === "emergency") {
      recommendedHospital = await Hospital.findOne({
        isActive: true,
        emergencyAvailable: true,
        state: { $regex: "kano", $options: "i" },
      }).select("name address phone emergencyPhone");
    }

    await session.save();

    res.status(200).json({
      success: true,
      sessionId: session.sessionId,
      reply: aiReply,
      urgencyLevel,
      recommendedHospital,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/ai/sessions
exports.getMySessions = async (req, res, next) => {
  try {
    const sessions = await AISession.find({ user: req.user._id })
      .select("sessionId context urgencyLevel isResolved createdAt updatedAt")
      .sort("-updatedAt")
      .limit(20);
    res.status(200).json({ success: true, sessions });
  } catch (error) {
    next(error);
  }
};

// GET /api/ai/sessions/:sessionId
exports.getSession = async (req, res, next) => {
  try {
    const session = await AISession.findOne({
      sessionId: req.params.sessionId,
      user: req.user._id,
    });
    if (!session) return next(new AppError("Session not found", 404));
    res.status(200).json({ success: true, session });
  } catch (error) {
    next(error);
  }
};

// POST /api/ai/symptom-check
exports.symptomCheck = async (req, res, next) => {
  try {
    const { symptoms, age, gender, language = "en" } = req.body;
    if (!symptoms || !symptoms.length) return next(new AppError("Symptoms are required", 400));

    const prompt = `A patient reports the following symptoms: ${symptoms.join(", ")}. 
Age: ${age || "unknown"}, Gender: ${gender || "unknown"}.

Please provide:
1. Possible conditions (list 2-3 most likely, but DO NOT diagnose definitively)
2. Urgency level (low/moderate/high/emergency)
3. Recommended type of specialist to see
4. Immediate home care tips if safe to manage at home
5. Warning signs that require immediate hospital visit

Respond in ${language === "ha" ? "Hausa" : "simple English"}.`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: buildSystemPrompt(req.user, language) },
          { role: "user", content: prompt },
        ],
        max_tokens: 1000,
      }),
    });

    const aiData = await openaiResponse.json();
    const analysis = aiData.choices[0].message.content;

    // Find relevant doctors
    const symptomToSpecialty = {
      chest: "cardiologist", heart: "cardiologist",
      stomach: "gastroenterologist", abdomen: "gastroenterologist",
      head: "neurologist", brain: "neurologist",
      skin: "dermatologist", rash: "dermatologist",
      mental: "psychiatrist", anxiety: "psychiatrist",
      pregnancy: "obstetrician", pregnant: "obstetrician",
      kidney: "nephrologist", urine: "nephrologist",
    };

    let specialization = "general practitioner";
    for (const [keyword, spec] of Object.entries(symptomToSpecialty)) {
      if (symptoms.some((s) => s.toLowerCase().includes(keyword))) {
        specialization = spec;
        break;
      }
    }

    const suggestedDoctors = await Doctor.find({ specialization: { $regex: specialization, $options: "i" }, isVerified: true })
      .populate("user", "firstName lastName avatar")
      .limit(3);

    res.status(200).json({ success: true, analysis, suggestedDoctors, specialization });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/ai/sessions/:sessionId
exports.deleteSession = async (req, res, next) => {
  try {
    await AISession.findOneAndDelete({ sessionId: req.params.sessionId, user: req.user._id });
    res.status(200).json({ success: true, message: "Session deleted" });
  } catch (error) {
    next(error);
  }
};