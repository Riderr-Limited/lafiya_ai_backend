const request = require('supertest');
const app = require('../src/app');
const { createUser } = require('./helpers');

const hospitalPayload = {
  name: 'Aminu Kano Teaching Hospital',
  type: 'tertiary',
  address: 'Zaria Road, Kano',
  state: 'Kano',
  lga: 'Nassarawa',
  phone: ['064123456'],
  hasEmergency: true,
  isVerified: true,
  location: { type: 'Point', coordinates: [8.5167, 12.0022] },
  services: ['emergency', 'maternity'],
};

describe('Hospital Endpoints', () => {
  let patientToken, adminToken, hospitalId;

  beforeEach(async () => {
    const patient = await createUser({ phone: '08033000001', role: 'patient' });
    const admin = await createUser({ phone: '08033000002', role: 'admin' });
    patientToken = patient.token;
    adminToken = admin.token;

    const res = await request(app)
      .post('/api/hospitals')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(hospitalPayload);
    hospitalId = res.body.hospital._id;
  });

  describe('POST /api/hospitals', () => {
    it('admin can add a hospital', async () => {
      const res = await request(app)
        .post('/api/hospitals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...hospitalPayload, name: 'New Hospital', location: { type: 'Point', coordinates: [8.52, 12.01] } });
      expect(res.status).toBe(201);
      expect(res.body.hospital.name).toBe('New Hospital');
    });

    it('patient cannot add a hospital', async () => {
      const res = await request(app)
        .post('/api/hospitals')
        .set('Authorization', `Bearer ${patientToken}`)
        .send(hospitalPayload);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/hospitals/:id', () => {
    it('returns hospital by id', async () => {
      const res = await request(app)
        .get(`/api/hospitals/${hospitalId}`)
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res.status).toBe(200);
      expect(res.body.hospital.name).toBe('Aminu Kano Teaching Hospital');
    });

    it('returns 404 for unknown id', async () => {
      const res = await request(app)
        .get('/api/hospitals/64f000000000000000000000')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/hospitals', () => {
    it('lists verified hospitals', async () => {
      const res = await request(app)
        .get('/api/hospitals')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res.status).toBe(200);
      expect(res.body.hospitals.length).toBeGreaterThan(0);
    });

    it('filters by emergency', async () => {
      const res = await request(app)
        .get('/api/hospitals?emergency=true')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res.status).toBe(200);
      res.body.hospitals.forEach((h) => expect(h.hasEmergency).toBe(true));
    });

    it('filters by type', async () => {
      const res = await request(app)
        .get('/api/hospitals?type=tertiary')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res.status).toBe(200);
      res.body.hospitals.forEach((h) => expect(h.type).toBe('tertiary'));
    });
  });
});
