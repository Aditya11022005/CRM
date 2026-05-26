const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please add an offer/coupon code'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  discountPercent: {
    type: Number,
    required: [true, 'Please add a discount percentage'],
    min: 1,
    max: 100,
  },
  description: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  expiresAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Offer', OfferSchema);
