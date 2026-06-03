const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const SYSTEM_PROMPT = `You are LafiyaAI, a trusted health assistant for communities in Northern Nigeria.
You provide health guidance in both Hausa and English. You ONLY answer health-related questions.
You must always:
1. Assess risk level: low, medium, high, or emergency
2. Give clear next steps
3. Recommend escalation to a doctor or hospital when risk is high/emergency
4. Flag if the question involves pregnancy (maternal health priority)
5. Never diagnose — only guide and recommend
6. Respond in the same language the user used (Hausa or English)

Respond ONLY in valid JSON (no markdown, no code blocks):
{
  "summary": "brief summary of the health concern",
  "riskLevel": "low|medium|high|emergency",
  "recommendations": ["recommendation 1", "recommendation 2"],
  "nextSteps": ["step 1", "step 2"],
  "escalate": true|false
}`;

const parseJSON = (text) => {
  const cleaned = text.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
};

exports.analyzeSymptoms = async ({ symptoms, language, patientAge, patientGender, isPregnant }) => {
  const userMessage = `
Language: ${language}
Symptoms: ${symptoms.join(', ')}
${patientAge ? `Age: ${patientAge}` : ''}
${patientGender ? `Gender: ${patientGender}` : ''}
${isPregnant ? 'Patient is pregnant.' : ''}
  `.trim();

  const result = await model.generateContent(`${SYSTEM_PROMPT}\n\n${userMessage}`);
  const raw = result.response.text();
  const parsed = parseJSON(raw);
  return { ...parsed, rawResponse: raw };
};

exports.detectMisinformation = async (content) => {
  const prompt = `You are a medical fact-checker. Analyze the following health claim and respond ONLY in valid JSON (no markdown, no code blocks):
{"isMisinformation": true|false, "reason": "brief explanation", "confidence": 0-100}

Claim: ${content}`;

  const result = await model.generateContent(prompt);
  return parseJSON(result.response.text());
};
