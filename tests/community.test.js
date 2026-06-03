const request = require('supertest');
const app = require('../src/app');
const { createUser } = require('./helpers');

jest.mock('../src/services/aiService', () => ({
  analyzeSymptoms: jest.fn(),
  detectMisinformation: jest.fn().mockResolvedValue({
    isMisinformation: false,
    reason: 'Accurate',
    confidence: 5,
  }),
}));

describe('Community Endpoints', () => {
  let patientToken, adminToken, doctorToken, groupId, postId;

  beforeEach(async () => {
    const patient = await createUser({ phone: '08022000001', role: 'patient' });
    const admin = await createUser({ phone: '08022000002', role: 'admin' });
    const doctor = await createUser({ phone: '08022000003', role: 'doctor' });
    patientToken = patient.token;
    adminToken = admin.token;
    doctorToken = doctor.token;

    // seed a group
    const groupRes = await request(app)
      .post('/api/community/groups')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Health Group', category: 'general', description: 'General health' });
    groupId = groupRes.body.group._id;

    // seed a post
    const postRes = await request(app)
      .post(`/api/community/groups/${groupId}/posts`)
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ content: 'Wash hands to prevent disease', language: 'english', type: 'info' });
    postId = postRes.body.post._id;
  });

  describe('GET /api/community/groups', () => {
    it('lists active groups', async () => {
      const res = await request(app)
        .get('/api/community/groups')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res.status).toBe(200);
      expect(res.body.groups.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/community/groups', () => {
    it('admin can create a group', async () => {
      const res = await request(app)
        .post('/api/community/groups')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Maternal Health', category: 'maternal_health', description: 'For mothers' });
      expect(res.status).toBe(201);
      expect(res.body.group.name).toBe('Maternal Health');
    });

    it('patient cannot create a group', async () => {
      const res = await request(app)
        .post('/api/community/groups')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ name: 'Unauthorized Group', category: 'general' });
      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/community/groups/:id/join', () => {
    it('patient can join a group', async () => {
      const res = await request(app)
        .post(`/api/community/groups/${groupId}/join`)
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/joined/i);
    });
  });

  describe('GET /api/community/groups/:id/posts', () => {
    it('returns posts for a group', async () => {
      const res = await request(app)
        .get(`/api/community/groups/${groupId}/posts`)
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res.status).toBe(200);
      expect(res.body.posts.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/community/groups/:id/posts', () => {
    it('creates a post with misinformation check', async () => {
      const res = await request(app)
        .post(`/api/community/groups/${groupId}/posts`)
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ content: 'Drink clean water daily', language: 'english', type: 'info' });
      expect(res.status).toBe(201);
      expect(res.body.post.content).toBe('Drink clean water daily');
      expect(res.body.misinfoCheck).toBeDefined();
    });
  });

  describe('POST /api/community/posts/:id/reply', () => {
    it('adds a reply to a post', async () => {
      const res = await request(app)
        .post(`/api/community/posts/${postId}/reply`)
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ content: 'Correct, handwashing is essential.' });
      expect(res.status).toBe(200);
      expect(res.body.post.replies.length).toBe(1);
    });
  });

  describe('PATCH /api/community/posts/:id/verify', () => {
    it('doctor can verify a post', async () => {
      const res = await request(app)
        .patch(`/api/community/posts/${postId}/verify`)
        .set('Authorization', `Bearer ${doctorToken}`);
      expect(res.status).toBe(200);
      expect(res.body.post.doctorVerified).toBe(true);
    });

    it('patient cannot verify a post', async () => {
      const res = await request(app)
        .patch(`/api/community/posts/${postId}/verify`)
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/community/posts/:id/flag', () => {
    it('patient can flag a post', async () => {
      const res = await request(app)
        .patch(`/api/community/posts/${postId}/flag`)
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res.status).toBe(200);
      expect(res.body.flagCount).toBe(1);
    });
  });
});
