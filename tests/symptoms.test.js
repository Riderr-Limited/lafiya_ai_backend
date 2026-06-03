const request = require('supertest');
const app = require('../src/app');
const { createUser } = require('./helpers');

jest.mock('../src/services/aiService', () => ({
  analyzeSymptoms: jest.fn().mockResolvedValue({
    summary: 'Possible malaria symptoms',
    riskLevel: 'medium',
    recommendations: ['Rest and hydrate', 'Take paracetamol for fever'],
    nextSteps: ['Visit a clinic for malaria test'],
    escalate: false,
    rawResponse: '{}',
  }),
  detectMisinformation: jest.fn().mockResolvedValue({
    isMisinformation: false,
    reason: 'Accurate health information',
    confidence: 10,
  }),
}));

describe('Symptom Endpoints', () => {
  let patientToken, doctorToken;

  beforeEach(async () => {
    const patient = await createUser({ phone: '08011000001', role: 'patient' });
    const doctor = await createUser({ phone: '08011000002', role: 'doctor' });
    patientToken = patient.token;
    doctorToken = doctor.token;
  });

  describe('POST /api/symptoms/check', () => {
    it('creates a symptom check and returns AI response', async () => {
      const res = await request(app)
        .post('/api/symptoms/check')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ symptoms: ['fever', 'headache'], language: 'english', patientAge: 25, patientGender: 'male' });
      expect(res.status).toBe(201);
      expect(res.body.check.aiResponse.riskLevel).toBe('medium');
      expect(res.body.check.symptoms).toContain('fever');
    });

    it('rejects empty symptoms', async () => {
      const res = await request(app)
        .post('/api/symptoms/check')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ symptoms: [] });
      expect(res.status).toBe(400);
    });

    it('rejects unauthenticated request', async () => {
      const res = await request(app).post('/api/symptoms/check').send({ symptoms: ['fever'] });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/symptoms/history', () => {
    it('returns symptom history for the user', async () => {
      await request(app)
        .post('/api/symptoms/check')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ symptoms: ['cough'], language: 'english' });

      const res = await request(app)
        .get('/api/symptoms/history')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res.status).toBe(200);
      expect(res.body.checks.length).toBe(1);
    });
  });

  describe('PATCH /api/symptoms/:id/review', () => {
    it('allows doctor to review a symptom check', async () => {
      const checkRes = await request(app)
        .post('/api/symptoms/check')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ symptoms: ['fever'], language: 'english' });

      const id = checkRes.body.check._id;
      const res = await request(app)
        .patch(`/api/symptoms/${id}/review`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ notes: 'Likely malaria, please get tested.' });
      expect(res.status).toBe(200);
      expect(res.body.check.doctorReview.notes).toBe('Likely malaria, please get tested.');
    });

    it('denies patient from reviewing', async () => {
      const checkRes = await request(app)
        .post('/api/symptoms/check')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ symptoms: ['fever'], language: 'english' });

      const id = checkRes.body.check._id;
      const res = await request(app)
        .patch(`/api/symptoms/${id}/review`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ notes: 'Self review' });
      expect(res.status).toBe(403);
    });
  });
});
