const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    default: null,
  },
  clientName: {
    type: String,
    required: true,
  },
  clientEmail: {
    type: String,
    default: '',
  },
  invoiceNumber: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  items: [
    {
      description: { type: String, required: true },
      quantity: { type: Number, required: true, default: 1 },
      rate: { type: Number, required: true, default: 0 },
      gstPercent: { type: Number, default: 0 },
      discountPercent: { type: Number, default: 0 },
    },
  ],
  subtotal: {
    type: Number,
    required: true,
    default: 0,
  },
  discountTotal: {
    type: Number,
    default: 0,
  },
  gstTotal: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
    default: 0,
  },
  notes: {
    type: String,
    default: '',
  },
  termsConditions: {
    type: String,
    default: '',
  },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Paid', 'Overdue'],
    default: 'Unpaid',
  },
  razorpayOrderId: {
    type: String,
    default: '',
  },
  razorpayPaymentId: {
    type: String,
    default: '',
  },
  qrUrl: {
    type: String,
    default: '',
  },
  templateName: {
    type: String,
    default: 'Classic',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
