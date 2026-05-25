const mongoose = require('mongoose');

const BusinessSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please add a business name'],
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  logo: {
    type: String,
    default: '',
  },
  themeColor: {
    type: String,
    default: '#6366f1', // default Indigo-500
  },
  gstNumber: {
    type: String,
    trim: true,
    default: '',
  },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    zip: { type: String, default: '' },
  },
  currency: {
    type: String,
    default: 'INR',
  },
  timezone: {
    type: String,
    default: 'Asia/Kolkata',
  },
  isApproved: {
    type: Boolean,
    default: true,
  },
  aiContext: {
    type: String,
    default: 'We build premium websites, improve Google Maps SEO, and integrate automatic WhatsApp review boosters.',
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Business', BusinessSchema);
