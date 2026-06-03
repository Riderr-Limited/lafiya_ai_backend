const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['primary', 'secondary', 'tertiary', 'clinic', 'pharmacy'], required: true },
  address: { type: String, required: true },
  state: { type: String, required: true },
  lga: String,
  phone: [String],
  services: [String],
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  operatingHours: String,
  hasEmergency: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
}, { timestamps: true });

hospitalSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Hospital', hospitalSchema);
