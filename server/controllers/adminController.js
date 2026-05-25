const User = require('../models/User');
const Business = require('../models/Business');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');

/**
 * @desc    Get platform-wide statistics for Super Admin
 * @route   GET /api/v1/admin/stats
 * @access  Private (Super Admin only)
 */
exports.getPlatformStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBusinesses = await Business.countDocuments();
    const totalPayments = await Payment.countDocuments({ status: 'Completed' });
    
    const payments = await Payment.find({ status: 'Completed' });
    const platformRevenue = payments.reduce((sum, pay) => sum + pay.amount, 0);

    const activeSubscriptions = await Subscription.countDocuments({ status: { $in: ['Active', 'Trial'] } });

    // Recent 5 payments
    const recentPayments = await Payment.find()
      .populate('user', 'name email')
      .populate('business', 'name')
      .sort({ date: -1 })
      .limit(5);

    // Business approvals required
    const pendingBusinesses = await Business.find({ isApproved: false })
      .populate('owner', 'name email');

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalBusinesses,
        totalPayments,
        platformRevenue,
        activeSubscriptions,
      },
      recentPayments,
      pendingBusinesses,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all users on the platform
 * @route   GET /api/v1/admin/users
 * @access  Private (Super Admin only)
 */
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Block or Unblock a user
 * @route   PATCH /api/v1/admin/users/:id/block
 * @access  Private (Super Admin only)
 */
exports.toggleBlockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Do not let Super Admin block themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, error: 'You cannot block your own Super Admin account' });
    }

    user.status = user.status === 'active' ? 'blocked' : 'active';
    await user.save();

    res.status(200).json({
      success: true,
      message: `User account has been ${user.status === 'active' ? 'unblocked' : 'blocked'} successfully`,
      user,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all businesses registered
 * @route   GET /api/v1/admin/businesses
 * @access  Private (Super Admin only)
 */
exports.getBusinesses = async (req, res, next) => {
  try {
    const businesses = await Business.find().populate('owner', 'name email').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: businesses.length,
      businesses,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Toggle business approval status
 * @route   PATCH /api/v1/admin/businesses/:id/approve
 * @access  Private (Super Admin only)
 */
exports.toggleApproveBusiness = async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({ success: false, error: 'Business not found' });
    }

    business.isApproved = !business.isApproved;
    await business.save();

    res.status(200).json({
      success: true,
      message: `Business status updated. Approval: ${business.isApproved}`,
      business,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get platform revenue transactions
 * @route   GET /api/v1/admin/payments
 * @access  Private (Super Admin only)
 */
exports.getPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find()
      .populate('user', 'name email')
      .populate('business', 'name')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (err) {
    next(err);
  }
};
