const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Please add lead name / business name'],
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    default: '',
  },
  website: {
    type: String,
    trim: true,
    default: '',
  },
  address: {
    type: String,
    default: '',
  },
  rating: {
    type: Number,
    default: 0,
  },
  reviewsCount: {
    type: Number,
    default: 0,
  },
  category: {
    type: String,
    trim: true,
    default: '',
  },
  city: {
    type: String,
    trim: true,
    default: '',
  },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'Interested', 'Follow-up', 'Converted', 'Closed'],
    default: 'New',
  },
  source: {
    type: String,
    enum: ['Google Maps (API)', 'Google Maps (Scraping)', 'Justdial', 'IndiaMart', 'Yellow Pages', 'CSV Import', 'Facebook', 'LinkedIn', 'Sulekha', 'Manual'],
    default: 'Manual',
  },
  latitude: {
    type: Number,
    default: null,
  },
  longitude: {
    type: Number,
    default: null,
  },
  openingHours: {
    type: String,
    default: '',
  },
  mapsUrl: {
    type: String,
    default: '',
  },
  isFavorite: {
    type: Boolean,
    default: false,
  },
  ownerName: {
    type: String,
    default: '',
  },
  aiScore: {
    type: String,
    enum: ['High', 'Medium', 'Low', ''],
    default: '',
  },
  aiAnalysis: {
    type: String,
    default: '',
  },
  aiEnriched: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update index to optimize duplicate check based on business, phone, email, and mapsUrl
LeadSchema.index({ business: 1, phone: 1, email: 1, mapsUrl: 1 });

module.exports = mongoose.model('Lead', LeadSchema);
