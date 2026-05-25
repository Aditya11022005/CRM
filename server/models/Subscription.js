const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  plan: {
    type: String,
    enum: ['Free Trial', 'Monthly', '6 Month', 'Yearly'],
    default: 'Free Trial',
  },
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['Active', 'Expired', 'Trial'],
    default: 'Trial',
  },
  razorpaySubscriptionId: {
    type: String,
    default: '',
  },
  limitLeads: {
    type: Number,
    default: 100, // free trial limit
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

module.exports = mongoose.model('Subscription', SubscriptionSchema);
