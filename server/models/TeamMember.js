const mongoose = require('mongoose');

const TeamMemberSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['Manager', 'Employee'],
    default: 'Employee',
  },
  permissions: {
    leads: { type: Boolean, default: true },
    crm: { type: Boolean, default: true },
    invoices: { type: Boolean, default: false },
    quotes: { type: Boolean, default: false },
    analytics: { type: Boolean, default: true },
  },
  status: {
    type: String,
    enum: ['Pending', 'Active'],
    default: 'Active',
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a user can only have one team member entry per business
TeamMemberSchema.index({ business: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('TeamMember', TeamMemberSchema);
