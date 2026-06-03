require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const apicache = require('apicache');
const connectDB = require('./config/db');

const app = express();
const cache = apicache.middleware;

// Connect DB
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Cron jobs
require('./jobs/medicationReminder');
require('./jobs/pregnancyReminder');

// Cached routes
app.use('/api/hospitals', cache('10 minutes'), require('./routes/hospitalRoutes'));
app.use('/api/content', cache('5 minutes'), require('./routes/contentRoutes'));
app.use('/api/community/groups', cache('2 minutes'), require('./routes/communityRoutes'));

// Core routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/symptoms', require('./routes/symptomRoutes'));
app.use('/api/community', require('./routes/communityRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));

// New feature routes
app.use('/api/voice', require('./routes/voiceRoutes'));
app.use('/api/sessions', require('./routes/sessionRoutes'));
app.use('/api/health-log', require('./routes/healthLogRoutes'));
app.use('/api/health-records', require('./routes/healthRecordRoutes'));
app.use('/api/consultations', require('./routes/consultationRoutes'));
app.use('/api/medications', require('./routes/medicationRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/pregnancy', require('./routes/pregnancyRoutes'));
app.use('/api/emergency', require('./routes/emergencyRoutes'));
app.use('/api/campaigns', require('./routes/campaignRoutes'));
app.use('/api/offline', require('./routes/offlineRoutes'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'LafiyaAI backend running' }));

// 404
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`LafiyaAI server running on port ${PORT}`));

module.exports = app;
