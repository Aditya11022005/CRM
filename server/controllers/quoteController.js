const Quote = require('../models/Quote');
const Lead = require('../models/Lead');
const { uploadFile } = require('../utils/cloudinary');

// Helper to generate quote numbers: QO-YYYYMMDD-XXXX
const generateQuoteNumber = async (businessId) => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await Quote.countDocuments({ business: businessId });
  const index = (count + 1).toString().padStart(4, '0');
  return `QO-${dateStr}-${index}`;
};

/**
 * @desc    Get all quotes for a business
 * @route   GET /api/v1/quotes
 * @access  Private (checked by checkBusinessAccess)
 */
exports.getQuotes = async (req, res, next) => {
  try {
    const { status, leadId } = req.query;
    const filter = { business: req.business._id };

    if (status) filter.status = status;
    if (leadId) filter.lead = leadId;

    const quotes = await Quote.find(filter)
      .populate('lead', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: quotes.length,
      quotes,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single quote
 * @route   GET /api/v1/quotes/:id
 * @access  Private
 */
exports.getQuote = async (req, res, next) => {
  try {
    const quote = await Quote.findOne({ _id: req.params.id, business: req.business._id }).populate(
      'lead',
      'name email phone address'
    );

    if (!quote) {
      return res.status(404).json({ success: false, error: 'Quote not found' });
    }

    res.status(200).json({ success: true, quote });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create Quote
 * @route   POST /api/v1/quotes
 * @access  Private
 */
exports.createQuote = async (req, res, next) => {
  try {
    const { leadId, clientName, clientEmail, dueDate, items, notes, termsConditions } = req.body;

    if (!clientName || !dueDate || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Client name, due date, and items are required' });
    }

    // Backend calculations to guarantee accuracy
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
    const quoteNumber = await generateQuoteNumber(req.business._id);

    const quote = await Quote.create({
      business: req.business._id,
      lead: leadId || null,
      clientName,
      clientEmail: clientEmail || '',
      quoteNumber,
      dueDate: new Date(dueDate),
      items: calculatedItems,
      subtotal,
      discountTotal,
      gstTotal,
      total,
      notes: notes || '',
      termsConditions: termsConditions || '',
      signatureUrl: '', // Will be updated via update endpoint or upload
      status: 'Draft',
    });

    res.status(201).json({
      success: true,
      message: 'Quote created successfully!',
      quote,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update Quote status / details / signature
 * @route   PUT /api/v1/quotes/:id
 * @access  Private
 */
exports.updateQuote = async (req, res, next) => {
  try {
    let quote = await Quote.findOne({ _id: req.params.id, business: req.business._id });

    if (!quote) {
      return res.status(404).json({ success: false, error: 'Quote not found' });
    }

    const { status, notes, termsConditions, items, dueDate } = req.body;

    if (status) quote.status = status;
    if (notes !== undefined) quote.notes = notes;
    if (termsConditions !== undefined) quote.termsConditions = termsConditions;
    if (dueDate) quote.dueDate = new Date(dueDate);

    // If items are modified, recompute calculations
    if (items && Array.isArray(items) && items.length > 0) {
      let subtotal = 0;
      let discountTotal = 0;
      let gstTotal = 0;

      quote.items = items.map((item) => {
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

      quote.subtotal = subtotal;
      quote.discountTotal = discountTotal;
      quote.gstTotal = gstTotal;
      quote.total = subtotal - discountTotal + gstTotal;
    }

    // Handle signature upload
    if (req.file) {
      quote.signatureUrl = await uploadFile(req.file);
    }

    await quote.save();

    res.status(200).json({
      success: true,
      message: 'Quote updated successfully!',
      quote,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete Quote
 * @route   DELETE /api/v1/quotes/:id
 * @access  Private
 */
exports.deleteQuote = async (req, res, next) => {
  try {
    const quote = await Quote.findOneAndDelete({ _id: req.params.id, business: req.business._id });

    if (!quote) {
      return res.status(404).json({ success: false, error: 'Quote not found' });
    }

    res.status(200).json({ success: true, message: 'Quote deleted successfully' });
  } catch (err) {
    next(err);
  }
};
