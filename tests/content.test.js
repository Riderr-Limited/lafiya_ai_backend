const request = require('supertest');
const app = require('../src/app');
const { createUser } = require('./helpers');

describe('Content Endpoints', () => {
  let patientToken, doctorToken, adminToken, contentId;

  beforeEach(async () => {
    const patient = await createUser({ phone: '08044000001', role: 'patient' });
    const doctor = await createUser({ phone: '08044000002', role: 'doctor' });
    const admin = await createUser({ phone: '08044000003', role: 'admin' });
    patientToken = patient.token;
    doctorToken = doctor.token;
    adminToken = admin.token;

    const res = await request(app)
      .post('/api/content')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({
        title: 'Preventing Malaria',
        body: 'Use insecticide-treated nets and eliminate standing water.',
        category: 'general',
        language: 'english',
        tags: ['malaria', 'prevention'],
      });
    contentId = res.body.content._id;
  });

  describe('POST /api/content', () => {
    it('doctor can create content', async () => {
      const res = await request(app)
        .post('/api/content')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ title: 'Hygiene Tips', body: 'Wash hands regularly.', category: 'hygiene', language: 'english' });
      expect(res.status).toBe(201);
      expect(res.body.content.title).toBe('Hygiene Tips');
    });

    it('patient cannot create content', async () => {
      const res = await request(app)
        .post('/api/content')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ title: 'Test', body: 'Test body', category: 'general', language: 'english' });
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/content/:id/verify', () => {
    it('admin can verify content with trust score', async () => {
      const res = await request(app)
        .patch(`/api/content/${contentId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ trustScore: 90 });
      expect(res.status).toBe(200);
      expect(res.body.content.isVerified).toBe(true);
      expect(res.body.content.trustScore).toBe(90);
    });

    it('doctor cannot verify content', async () => {
      const res = await request(app)
        .patch(`/api/content/${contentId}/verify`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ trustScore: 80 });
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/content', () => {
    it('lists verified and published content', async () => {
      // verify first so it appears in listing
      await request(app)
        .patch(`/api/content/${contentId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ trustScore: 85 });

      const res = await request(app)
        .get('/api/content')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res.status).toBe(200);
      expect(res.body.contents.length).toBeGreaterThan(0);
    });

    it('filters by category', async () => {
      await request(app)
        .patch(`/api/content/${contentId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ trustScore: 85 });

      const res = await request(app)
        .get('/api/content?category=general')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res.status).toBe(200);
      res.body.contents.forEach((c) => expect(c.category).toBe('general'));
    });
  });

  describe('GET /api/content/:id', () => {
    it('returns content by id and increments views', async () => {
      const res = await request(app)
        .get(`/api/content/${contentId}`)
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res.status).toBe(200);
      expect(res.body.content.views).toBe(1);
    });

    it('returns 404 for unknown id', async () => {
      const res = await request(app)
        .get('/api/content/64f000000000000000000000')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res.status).toBe(404);
    });
  });
});
