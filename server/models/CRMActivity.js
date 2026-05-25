const mongoose = require('mongoose');

const CRMActivitySchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['Note', 'Activity Log', 'Call Note', 'WhatsApp Action', 'Email Action', 'Reminder', 'Status Change'],
    default: 'Note',
  },
  description: {
    type: String,
    required: true,
  },
  reminderDate: {
    type: Date,
    default: null,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('CRMActivity', CRMActivitySchema);
