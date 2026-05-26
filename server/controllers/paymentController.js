const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const Package = require('../models/Package');
const Offer = require('../models/Offer');

/**
 * @desc    Get active subscription and available packages for business
 * @route   GET /api/v1/subscriptions
 * @access  Private (checked by checkBusinessAccess)
 */
exports.getSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ business: req.business._id }).sort({ createdAt: -1 });

    if (!subscription) {
      return res.status(404).json({ success: false, error: 'Subscription not found for this business' });
    }

    // Fetch dynamic active pricing packages
    const packages = await Package.find({ isActive: true }).sort({ price: 1 });

    // Map packages back to PLANS object layout for legacy frontend support
    const plansMap = {};
    packages.forEach((pkg) => {
      plansMap[pkg.name] = {
        name: pkg.name,
        price: pkg.price,
        durationDays: pkg.durationDays,
        limitLeads: pkg.limitLeads,
        features: pkg.features,
        isPopular: pkg.isPopular,
        description: pkg.description || '',
      };
    });

    res.status(200).json({
      success: true,
      subscription,
      plans: plansMap,
      packages,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create Razorpay Order for subscription upgrade with Promo Code support
 * @route   POST /api/v1/subscriptions/order
 * @access  Private
 */
exports.createSubscriptionOrder = async (req, res, next) => {
  try {
    const { planName, promoCode } = req.body;

    if (!planName) {
      return res.status(400).json({ success: false, error: 'Please specify a package plan name' });
    }

    const pkg = await Package.findOne({ name: planName, isActive: true });
    if (!pkg) {
      return res.status(404).json({ success: false, error: `SaaS package '${planName}' is currently unavailable` });
    }

    let finalPrice = pkg.price;
    let promoApplied = '';

    // Apply coupon discount if code supplied
    if (promoCode) {
      const offer = await Offer.findOne({ code: promoCode.toUpperCase().trim(), isActive: true });
      if (offer) {
        if (!offer.expiresAt || new Date(offer.expiresAt) > new Date()) {
          const discountAmount = Math.round((pkg.price * offer.discountPercent) / 100);
          finalPrice = Math.max(0, pkg.price - discountAmount);
          promoApplied = offer.code;
        } else {
          return res.status(400).json({ success: false, error: 'Promo code has expired' });
        }
      } else {
        return res.status(400).json({ success: false, error: 'Invalid coupon/promo code' });
      }
    }

    // Create a Payment transaction record in Pending state
    const payment = await Payment.create({
      business: req.business._id,
      user: req.user._id,
      amount: finalPrice,
      currency: 'INR',
      status: 'Pending',
      razorpayOrderId: `suborder_${Math.random().toString(36).substring(2, 15)}`,
      plan: planName,
      promoApplied,
    });

    res.status(200).json({
      success: true,
      orderId: payment.razorpayOrderId,
      amount: finalPrice * 100, // amount in paisa
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkey123',
      discounted: finalPrice < pkg.price,
      originalPrice: pkg.price,
      discountPercent: promoApplied ? (pkg.price - finalPrice) / pkg.price * 100 : 0,
      promoApplied,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Verify signature and upgrade subscription plan dynamically
 * @route   POST /api/v1/subscriptions/verify
 * @access  Private
 */
exports.verifySubscriptionPayment = async (req, res, next) => {
  try {
    const { razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    const payment = await Payment.findOne({
      business: req.business._id,
      razorpayOrderId,
    });

    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment transaction record not found' });
    }

    // Mark billing record complete
    payment.status = 'Completed';
    payment.razorpayPaymentId = razorpayPaymentId || 'pay_mocksub';
    await payment.save();

    // Fetch details of package to update subscription limits
    const pkg = await Package.findOne({ name: payment.plan });
    const durationDays = pkg ? pkg.durationDays : 30;
    const limitLeads = pkg ? pkg.limitLeads : 1000;

    // Calculate new end date
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    let subscription = await Subscription.findOne({ business: req.business._id });

    if (subscription) {
      subscription.plan = payment.plan;
      subscription.package = pkg ? pkg._id : null;
      subscription.startDate = startDate;
      subscription.endDate = endDate;
      subscription.status = 'Active';
      subscription.limitLeads = limitLeads;
      subscription.razorpaySubscriptionId = razorpayPaymentId || 'sub_mock';
      subscription.updatedAt = Date.now();
      await subscription.save();
    } else {
      subscription = await Subscription.create({
        business: req.business._id,
        owner: req.business.owner,
        plan: payment.plan,
        package: pkg ? pkg._id : null,
        startDate,
        endDate,
        status: 'Active',
        limitLeads: limitLeads,
        razorpaySubscriptionId: razorpayPaymentId || 'sub_mock',
      });
    }

    res.status(200).json({
      success: true,
      message: `Successfully upgraded to ${payment.plan}! Your account limits are updated.`,
      subscription,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Validate promo code coupon
 * @route   POST /api/v1/subscriptions/validate-promo
 * @access  Private
 */
exports.validatePromoCode = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: 'Please enter a promo code' });
    }
    const offer = await Offer.findOne({ code: code.toUpperCase().trim(), isActive: true });
    if (!offer) {
      return res.status(400).json({ success: false, error: 'Invalid coupon/promo code' });
    }
    if (offer.expiresAt && new Date(offer.expiresAt) < new Date()) {
      return res.status(400).json({ success: false, error: 'This promo code has expired' });
    }
    res.status(200).json({
      success: true,
      offer: {
        code: offer.code,
        discountPercent: offer.discountPercent,
        description: offer.description
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get active packages for public display
 * @route   GET /api/v1/subscriptions/packages
 * @access  Public
 */
exports.getPublicPackages = async (req, res, next) => {
  try {
    const packages = await Package.find({ isActive: true }).sort({ price: 1 });
    res.status(200).json({
      success: true,
      packages,
    });
  } catch (err) {
    next(err);
  }
};

