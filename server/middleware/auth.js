const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Business = require('../models/Business');
const TeamMember = require('../models/TeamMember');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwtsecretkeylead123');

    // Get user from database
    req.user = await User.findById(decoded.id).select('+password');
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }

    if (req.user.status === 'blocked') {
      return res.status(403).json({ success: false, error: 'User account is blocked' });
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

// Verify user has access to a specific business
exports.checkBusinessAccess = (requiredPermission = null) => {
  return async (req, res, next) => {
    try {
      const businessId = req.headers['x-business-id'] || req.query.businessId || req.body.businessId;

      if (!businessId) {
        return res.status(400).json({ success: false, error: 'Business ID is required in request headers or body' });
      }

      // Check if business exists
      const business = await Business.findById(businessId);
      if (!business) {
        return res.status(444).json({ success: false, error: 'Business not found' });
      }

      // Check subscription expiration
      const Subscription = require('../models/Subscription');
      const subscription = await Subscription.findOne({ business: businessId }).sort({ createdAt: -1 });
      if (subscription) {
        const now = new Date();
        if (now > subscription.endDate) {
          if (subscription.status !== 'Expired') {
            subscription.status = 'Expired';
            await subscription.save();
          }
          const isAllowedRoute = req.originalUrl.includes('/api/v1/payments') || 
                                 (req.originalUrl.includes('/api/v1/businesses') && req.method === 'GET');
          
          if (!isAllowedRoute) {
            return res.status(402).json({ 
              success: false, 
              error: 'Your subscription / 3-day free trial has expired. Please upgrade or renew your plan.' 
            });
          }
        }
      }

      // If Super Admin, grant access
      if (req.user.role === 'Super Admin') {
        req.business = business;
        req.userRoleInBusiness = 'Super Admin';
        return next();
      }

      // If Business Owner and owns this business, grant access
      if (business.owner.toString() === req.user._id.toString()) {
        req.business = business;
        req.userRoleInBusiness = 'Business Owner';
        return next();
      }

      // Check if Team Member
      const teamMember = await TeamMember.findOne({ business: businessId, user: req.user._id, status: 'Active' });
      if (!teamMember) {
        return res.status(403).json({ success: false, error: 'You do not have access to this business' });
      }

      // Check specific permission if specified (e.g. leads, crm, invoices, quotes, analytics)
      if (requiredPermission && !teamMember.permissions[requiredPermission]) {
        return res.status(403).json({
          success: false,
          error: `You do not have permission to access '${requiredPermission}' in this business`,
        });
      }

      // Attach context to request
      req.business = business;
      req.teamMember = teamMember;
      req.userRoleInBusiness = teamMember.role; // Manager or Employee
      req.permissions = teamMember.permissions;

      next();
    } catch (err) {
      console.error('Error in checkBusinessAccess middleware:', err);
      res.status(500).json({ success: false, error: 'Server error checking business access' });
    }
  };
};
