const request = require('supertest');
const app = require('../src/app');
const { createUser } = require('./helpers');

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('registers a patient and returns token', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Aminu Musa',
        phone: '08012345678',
        password: 'password123',
        role: 'patient',
        language: 'hausa',
      });
      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('patient');
    });

    it('registers a doctor', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Dr. Fatima',
        phone: '08077777777',
        password: 'doctor123',
        role: 'doctor',
        language: 'english',
      });
      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('doctor');
    });

    it('rejects duplicate phone', async () => {
      await createUser({ phone: '08011111111' });
      const res = await request(app).post('/api/auth/register').send({
        name: 'Another',
        phone: '08011111111',
        password: 'password123',
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already registered/i);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with correct credentials', async () => {
      const { phone, password } = await createUser({ phone: '08022222222' });
      const res = await request(app).post('/api/auth/login').send({ phone, password });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('rejects wrong password', async () => {
      const { phone } = await createUser({ phone: '08033333333' });
      const res = await request(app).post('/api/auth/login').send({ phone, password: 'wrongpass' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns current user', async () => {
      const { token } = await createUser({ phone: '08044444444' });
      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
    });

    it('rejects unauthenticated request', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/auth/me', () => {
    it('updates profile name and language', async () => {
      const { token } = await createUser({ phone: '08055555555' });
      const res = await request(app)
        .patch('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name', language: 'english' });
      expect(res.status).toBe(200);
      expect(res.body.user.name).toBe('Updated Name');
    });
  });
});
