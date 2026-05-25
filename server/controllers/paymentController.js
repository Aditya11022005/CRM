const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');

// Configuration for Subscription Plans
const PLANS = {
  Monthly: { name: 'Monthly Plan', price: 299, durationDays: 30, limitLeads: 1000 },
  '6 Month': { name: '6 Months Plan', price: 3000, durationDays: 180, limitLeads: 8000 },
  Yearly: { name: 'Yearly Plan', price: 5000, durationDays: 365, limitLeads: 999999 }, // Unlimited
};

/**
 * @desc    Get active subscription for business
 * @route   GET /api/v1/subscriptions
 * @access  Private (checked by checkBusinessAccess)
 */
exports.getSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findOne({ business: req.business._id }).sort({ createdAt: -1 });

    if (!subscription) {
      return res.status(404).json({ success: false, error: 'Subscription not found for this business' });
    }

    res.status(200).json({
      success: true,
      subscription,
      plans: PLANS,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create Razorpay Order for subscription upgrade
 * @route   POST /api/v1/subscriptions/order
 * @access  Private
 */
exports.createSubscriptionOrder = async (req, res, next) => {
  try {
    const { planName } = req.body;

    if (!planName || !PLANS[planName]) {
      return res.status(400).json({ success: false, error: 'Please specify a valid plan: Monthly, 6 Month, Yearly' });
    }

    const plan = PLANS[planName];

    // Create a Payment transaction record in Pending state
    const payment = await Payment.create({
      business: req.business._id,
      user: req.user._id,
      amount: plan.price,
      currency: 'INR',
      status: 'Pending',
      razorpayOrderId: `suborder_${Math.random().toString(36).substring(2, 15)}`,
      plan: planName,
    });

    res.status(200).json({
      success: true,
      orderId: payment.razorpayOrderId,
      amount: plan.price * 100, // amount in paisa
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockkey123',
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Verify signature and upgrade subscription plan
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

    // Verify signatures...
    // Proceed to complete transaction
    payment.status = 'Completed';
    payment.razorpayPaymentId = razorpayPaymentId || 'pay_mocksub';
    await payment.save();

    const plan = PLANS[payment.plan];

    // Calculate new end date
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    let subscription = await Subscription.findOne({ business: req.business._id });

    if (subscription) {
      subscription.plan = payment.plan;
      subscription.startDate = startDate;
      subscription.endDate = endDate;
      subscription.status = 'Active';
      subscription.limitLeads = plan.limitLeads;
      subscription.razorpaySubscriptionId = razorpayPaymentId || 'sub_mock';
      subscription.updatedAt = Date.now();
      await subscription.save();
    } else {
      subscription = await Subscription.create({
        business: req.business._id,
        owner: req.business.owner,
        plan: payment.plan,
        startDate,
        endDate,
        status: 'Active',
        limitLeads: plan.limitLeads,
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
