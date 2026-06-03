const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true, lowercase: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
  language: { type: String, enum: ['hausa', 'english'], default: 'hausa' },
  location: {
    state: String,
    lga: String,
    coordinates: { type: [Number], index: '2dsphere' },
  },
  // Doctor-specific
  doctorProfile: {
    specialization: String,
    licenseNumber: String,
    isVerified: { type: Boolean, default: false },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
    trustScore: { type: Number, default: 0 },
  },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
