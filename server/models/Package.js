const mongoose = require('mongoose');

const PackageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a package name'],
    unique: true,
    trim: true,
  },
  price: {
    type: Number,
    required: [true, 'Please add a price in INR'],
    min: 0,
  },
  durationDays: {
    type: Number,
    required: [true, 'Please add duration in days'],
    min: 1,
  },
  limitLeads: {
    type: Number,
    required: [true, 'Please add a lead limit'],
    default: 1000,
  },
  description: {
    type: String,
    trim: true,
  },
  features: {
    type: [String],
    default: [],
  },
  isPopular: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Package', PackageSchema);
