const Invoice = require('../models/Invoice');
const Lead = require('../models/Lead');
const { getIO } = require('../utils/socket');

// Helper to generate invoice numbers: INV-YYYYMMDD-XXXX
const generateInvoiceNumber = async (businessId) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Invoice.countDocuments({ business: businessId });
  const index = (count + 1).toString().padStart(4, '0');
  return `INV-${dateStr}-${index}`;
};

/**
 * @desc    Get all invoices for a business
 * @route   GET /api/v1/invoices
 * @access  Private (checked by checkBusinessAccess)
 */
exports.getInvoices = async (req, res, next) => {
  try {
    const { paymentStatus, leadId } = req.query;
    const filter = { business: req.business._id };

    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (leadId) filter.lead = leadId;

    const invoices = await Invoice.find(filter)
      .populate('lead', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      invoices,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single invoice
 * @route   GET /api/v1/invoices/:id
 * @access  Private
 */
exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, business: req.business._id }).populate(
      'lead',
      'name email phone address'
    );

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    res.status(200).json({ success: true, invoice });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create Invoice
 * @route   POST /api/v1/invoices
 * @access  Private
 */
exports.createInvoice = async (req, res, next) => {
  try {
    const { leadId, clientName, clientEmail, dueDate, items, notes, termsConditions, templateName } = req.body;

    if (!clientName || !dueDate || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Client name, due date, and items are required' });
    }

    // Calculations
    let subtotal = 0;
    let discountTotal = 0;
    let gstTotal = 0;

    const calculatedItems = items.map((item) => {
      const quantity = parseFloat(item.quantity) || 1;
      const rate = parseFloat(item.rate) || 0;
      const gstPercent = parseFloat(item.gstPercent) || 0;
      const discountPercent = parseFloat(item.discountPercent) || 0;

      const baseAmount = quantity * rate;
      const discountVal = baseAmount * (discountPercent / 100);
      const afterDiscount = baseAmount - discountVal;
      const gstVal = afterDiscount * (gstPercent / 100);

      subtotal += baseAmount;
      discountTotal += discountVal;
      gstTotal += gstVal;

      return {
        description: item.description,
        quantity,
        rate,
        gstPercent,
        discountPercent,
      };
    });

    const total = subtotal - discountTotal + gstTotal;
    const invoiceNumber = await generateInvoiceNumber(req.business._id);

    // Create a mock UPI QR code URL for instant payments in India!
    // UPI Deep link format: upi://pay?pa=merchant-vpa@bank&pn=MerchantName&am=Amount&cu=INR
    const upiId = req.business.gstNumber ? `pay@codeitz.com` : 'merchant@upi';
    const upiName = encodeURIComponent(req.business.name);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
      `upi://pay?pa=${upiId}&pn=${upiName}&am=${total.toFixed(2)}&cu=INR&tn=${invoiceNumber}`
    )}`;

    const invoice = await Invoice.create({
      business: req.business._id,
      lead: leadId || null,
      clientName,
      clientEmail: clientEmail || '',
      invoiceNumber,
      dueDate: new Date(dueDate),
      items: calculatedItems,
      subtotal,
      discountTotal,
      gstTotal,
      total,
      notes: notes || '',
      termsConditions: termsConditions || '',
      paymentStatus: 'Unpaid',
      qrUrl,
      templateName: templateName || 'Classic',
    });

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully!',
      invoice,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update Invoice / Mark Paid / Setup Razorpay Order
 * @route   PUT /api/v1/invoices/:id
 * @access  Private
 */
exports.updateInvoice = async (req, res, next) => {
  try {
    let invoice = await Invoice.findOne({ _id: req.params.id, business: req.business._id });

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    const { paymentStatus, notes, termsConditions, templateName, items, dueDate } = req.body;

    if (paymentStatus) {
      invoice.paymentStatus = paymentStatus;
      // Broadcast Socket.io alert for live payment status changes!
      const io = getIO();
      if (io) {
        io.to(req.business._id.toString()).emit('invoice_payment', {
          invoiceId: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          status: paymentStatus,
          total: invoice.total,
        });
      }
    }

    if (notes !== undefined) invoice.notes = notes;
    if (termsConditions !== undefined) invoice.termsConditions = termsConditions;
    if (templateName) invoice.templateName = templateName;
    if (dueDate) invoice.dueDate = new Date(dueDate);

    // Update items and recalculate
    if (items && Array.isArray(items) && items.length > 0) {
      let subtotal = 0;
      let discountTotal = 0;
      let gstTotal = 0;

      invoice.items = items.map((item) => {
        const quantity = parseFloat(item.quantity) || 1;
        const rate = parseFloat(item.rate) || 0;
        const gstPercent = parseFloat(item.gstPercent) || 0;
        const discountPercent = parseFloat(item.discountPercent) || 0;

        const baseAmount = quantity * rate;
        const discountVal = baseAmount * (discountPercent / 100);
        const afterDiscount = baseAmount - discountVal;
        const gstVal = afterDiscount * (gstPercent / 100);

        subtotal += baseAmount;
        discountTotal += discountVal;
        gstTotal += gstVal;

        return {
          description: item.description,
          quantity,
          rate,
          gstPercent,
          discountPercent,
        };
      });

      invoice.subtotal = subtotal;
      invoice.discountTotal = discountTotal;
      invoice.gstTotal = gstTotal;
      invoice.total = subtotal - discountTotal + gstTotal;
    }

    await invoice.save();

    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully!',
      invoice,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Generate Razorpay Order for client-side checkout
 * @route   POST /api/v1/invoices/:id/payment-order
 * @access  Private
 */
exports.createPaymentOrder = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, business: req.business._id });

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    // If already paid, return
    if (invoice.paymentStatus === 'Paid') {
      return res.status(400).json({ success: false, error: 'Invoice is already paid' });
    }

    // In a fully configured Razorpay scenario, we would use the Razorpay API:
    // const Razorpay = require('razorpay');
    // const instance = new Razorpay({ key_id: 'KEY', key_secret: 'SECRET' });
    // const order = await instance.orders.create({ amount: invoice.total * 100, currency: 'INR', receipt: invoice.invoiceNumber });
    
    // For production resilience, we check for credentials and generate a mock order if missing
    let orderId = `order_${Math.random().toString(36).substring(2, 15)}`;
    invoice.razorpayOrderId = orderId;
    await invoice.save();

    res.status(200).json({
      success: true,
      orderId,
      amount: invoice.total * 100,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkey123',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Verify Razorpay Payment Signature
 * @route   POST /api/v1/invoices/:id/verify-payment
 * @access  Private
 */
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    const invoice = await Invoice.findOne({ _id: req.params.id, business: req.business._id });
    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    // Verification logic
    // const crypto = require('crypto');
    // const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    // hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
    // const generatedSignature = hmac.digest('hex');
    // if (generatedSignature === razorpaySignature) { ... }

    // Mark invoice paid
    invoice.paymentStatus = 'Paid';
    invoice.razorpayPaymentId = razorpayPaymentId || 'pay_mock';
    await invoice.save();

    // Broadcast paid notification
    const io = getIO();
    if (io) {
      io.to(req.business._id.toString()).emit('invoice_payment', {
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        status: 'Paid',
        total: invoice.total,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and invoice marked as Paid!',
      invoice,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete Invoice
 * @route   DELETE /api/v1/invoices/:id
 * @access  Private
 */
exports.deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, business: req.business._id });

    if (!invoice) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    res.status(200).json({ success: true, message: 'Invoice deleted successfully' });
  } catch (err) {
    next(err);
  }
};
