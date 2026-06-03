const request = require('supertest');
const app = require('../src/app');
const { createUser } = require('./helpers');

describe('Doctor Endpoints', () => {
  let patientToken, doctorToken, adminToken, doctorId;

  beforeEach(async () => {
    const patient = await createUser({ phone: '08055000001', role: 'patient' });
    const doctor = await createUser({ phone: '08055000002', role: 'doctor' });
    const admin = await createUser({ phone: '08055000003', role: 'admin' });
    patientToken = patient.token;
    doctorToken = doctor.token;
    adminToken = admin.token;
    doctorId = doctor.user.id;
  });

  describe('PATCH /api/doctors/profile', () => {
    it('doctor can update their profile', async () => {
      const res = await request(app)
        .patch('/api/doctors/profile')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ specialization: 'general', licenseNumber: 'MDCN-12345', hospital: 'Kano Hospital' });
      expect(res.status).toBe(200);
      expect(res.body.doctor.doctorProfile.specialization).toBe('general');
      expect(res.body.doctor.doctorProfile.licenseNumber).toBe('MDCN-12345');
    });

    it('patient cannot update doctor profile', async () => {
      const res = await request(app)
        .patch('/api/doctors/profile')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({ specialization: 'general' });
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/doctors/:id/verify', () => {
    it('admin can verify a doctor', async () => {
      const res = await request(app)
        .patch(`/api/doctors/${doctorId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.doctor.doctorProfile.isVerified).toBe(true);
    });

    it('patient cannot verify a doctor', async () => {
      const res = await request(app)
        .patch(`/api/doctors/${doctorId}/verify`)
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/doctors', () => {
    it('lists verified doctors', async () => {
      // verify the doctor first
      await request(app)
        .patch(`/api/doctors/${doctorId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`);

      // update profile so specialization is set
      await request(app)
        .patch('/api/doctors/profile')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ specialization: 'general', licenseNumber: 'MDCN-99999' });

      const res = await request(app)
        .get('/api/doctors')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res.status).toBe(200);
      expect(res.body.doctors.length).toBeGreaterThan(0);
    });

    it('filters by specialization', async () => {
      await request(app)
        .patch(`/api/doctors/${doctorId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`);
      await request(app)
        .patch('/api/doctors/profile')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({ specialization: 'general', licenseNumber: 'MDCN-99999' });

      const res = await request(app)
        .get('/api/doctors?specialization=general')
        .set('Authorization', `Bearer ${patientToken}`);
      expect(res.status).toBe(200);
      res.body.doctors.forEach((d) =>
        expect(d.doctorProfile.specialization).toBe('general')
      );
    });
  });
});
