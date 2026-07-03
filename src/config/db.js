const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI environment variable is required. Set MONGO_URI to your MongoDB connection string before starting the app.');
    process.exit(1);
  }

  const conn = await mongoose.connect(uri);
  console.log(`MongoDB connected: ${conn.connection.host}`);
};

module.exports = connectDB;
