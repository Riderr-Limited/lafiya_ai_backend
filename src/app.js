require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');

const app = express();

// Connect DB
connectDB();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/symptoms', require('./routes/symptomRoutes'));
app.use('/api/community', require('./routes/communityRoutes'));
app.use('/api/hospitals', require('./routes/hospitalRoutes'));
app.use('/api/content', require('./routes/contentRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));

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
