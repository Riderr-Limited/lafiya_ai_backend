const request = require('supertest');
const app = require('../src/app');

const createUser = async (overrides = {}) => {
  const defaults = {
    name: 'Test User',
    phone: `080${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'password123',
    role: 'patient',
    language: 'english',
  };
  const data = { ...defaults, ...overrides };
  const res = await request(app).post('/api/auth/register').send(data);
  return { token: res.body.token, user: res.body.user, phone: data.phone, password: data.password };
};

const loginUser = async (phone, password) => {
  const res = await request(app).post('/api/auth/login').send({ phone, password });
  return res.body.token;
};

module.exports = { createUser, loginUser };
