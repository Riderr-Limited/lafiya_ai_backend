require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User.model');
const Hospital = require('./src/models/Hospital.model');
const Community = require('./src/models/Community.model');
const Content = require('./src/models/Content');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Hospital.deleteMany({}),
    Community.deleteMany({}),
    Content.deleteMany({}),
  ]);
  console.log('Cleared existing data');

  const hash = (p) => bcrypt.hash(p, 12);

  // --- Users ---
  const [patient, doctor, admin] = await User.insertMany([
    {
      firstName: 'Aminu',
      lastName: 'Musa',
      email: 'aminu.musa@example.com',
      phone: '08012345678',
      password: await hash('password123'),
      role: 'patient',
      preferredLanguage: 'ha',
      location: { state: 'Kano', lga: 'Nassarawa' },
    },
    {
      firstName: 'Fatima',
      lastName: 'Bello',
      email: 'dr.fatima.bello@example.com',
      phone: '08077777777',
      password: await hash('doctor123'),
      role: 'doctor',
      preferredLanguage: 'en',
      location: { state: 'Kano', lga: 'Fagge' },
    },
    {
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      phone: '08099999999',
      password: await hash('admin123'),
      role: 'admin',
      preferredLanguage: 'en',
    },
  ]);

  // --- Hospitals ---
  await Hospital.insertMany([
    {
      name: 'Aminu Kano Teaching Hospital',
      type: 'federal',
      address: 'Zaria Road, Kano',
      state: 'Kano',
      lga: 'Nassarawa',
      phone: ['064123456'],
      emergencyAvailable: true,
      isVerified: true,
      location: { type: 'Point', coordinates: [8.5167, 12.0022] },
      services: ['emergency', 'maternity', 'surgery', 'pediatrics'],
    },
    {
      name: 'Murtala Muhammad Specialist Hospital',
      type: 'state',
      address: 'Hospital Road, Kano',
      state: 'Kano',
      lga: 'Fagge',
      phone: ['064654321'],
      emergencyAvailable: true,
      isVerified: true,
      location: { type: 'Point', coordinates: [8.5200, 12.0050] },
      services: ['emergency', 'outpatient'],
    },
    {
      name: 'Wuse General Hospital',
      type: 'state',
      address: 'Wuse Zone 3, Abuja',
      state: 'FCT',
      lga: 'Wuse',
      phone: ['09012345678'],
      emergencyAvailable: false,
      isVerified: true,
      location: { type: 'Point', coordinates: [7.4898, 9.0579] },
      services: ['outpatient', 'maternity'],
    },
  ]);

  // --- Community Groups ---
  await Community.insertMany([
    {
      name: 'Maternal Health Kano',
      slug: 'maternal-health-kano',
      category: 'pregnancy_maternal',
      description: 'Support group for maternal health in Kano',
      moderators: [admin._id],
      members: [patient._id, doctor._id],
      isActive: true,
    },
    {
      name: 'Diabetes Support',
      slug: 'diabetes-support',
      category: 'diabetes',
      description: 'Community for diabetes patients and caregivers',
      moderators: [admin._id],
      members: [patient._id],
      isActive: true,
    },
    {
      name: 'General Health',
      slug: 'general-health',
      category: 'general_health',
      description: 'General health discussions',
      moderators: [admin._id],
      members: [],
      isActive: true,
    },
  ]);

  // --- Health Content ---
  await Content.insertMany([
    {
      title: 'Preventing Malaria in Northern Nigeria',
      body: 'Malaria is preventable. Use insecticide-treated nets, eliminate standing water, and seek treatment early if you have fever.',
      category: 'general',
      author: doctor._id,
      isVerified: true,
      verifiedBy: admin._id,
      verifiedAt: new Date(),
      trustScore: 90,
      isPublished: true,
      tags: ['malaria', 'prevention'],
      language: 'english',
    },
    {
      title: 'Maternal Nutrition Guide',
      body: 'Pregnant women should eat iron-rich foods, take folic acid supplements, and attend antenatal care regularly.',
      category: 'maternal_health',
      author: doctor._id,
      isVerified: true,
      verifiedBy: admin._id,
      verifiedAt: new Date(),
      trustScore: 95,
      isPublished: true,
      tags: ['pregnancy', 'nutrition'],
      language: 'english',
    },
  ]);

  console.log('\n✅ Seed complete!\n');
  console.log('=== LOGIN CREDENTIALS ===');
  console.log('Patient  → phone: 08012345678  password: password123');
  console.log('Doctor   → phone: 08077777777  password: doctor123');
  console.log('Admin    → phone: 08099999999  password: admin123');
  console.log('\nBase URL: http://localhost:5000');

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
