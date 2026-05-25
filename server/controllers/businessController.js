const Business = require('../models/Business');
const TeamMember = require('../models/TeamMember');
const Subscription = require('../models/Subscription');
const { uploadFile } = require('../utils/cloudinary');

/**
 * @desc    Create a new Business
 * @route   POST /api/v1/businesses
 * @access  Private
 */
exports.createBusiness = async (req, res, next) => {
  try {
    const { name, email, phone, street, city, state, country, zip, currency, timezone, gstNumber } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Business name is required' });
    }

    let logoUrl = '';
    if (req.file) {
      logoUrl = await uploadFile(req.file);
    }

    const business = await Business.create({
      owner: req.user._id,
      name,
      email: email || req.user.email,
      phone: phone || '',
      logo: logoUrl,
      gstNumber: gstNumber || '',
      address: {
        street: street || '',
        city: city || '',
        state: state || '',
        country: country || '',
        zip: zip || '',
      },
      currency: currency || 'INR',
      timezone: timezone || 'Asia/Kolkata',
    });

    // Auto-create a 3-day Free Trial subscription for this business
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 3); // 3 days trial

    await Subscription.create({
      business: business._id,
      owner: req.user._id,
      plan: 'Free Trial',
      startDate: new Date(),
      endDate: trialEndDate,
      status: 'Trial',
      limitLeads: 100, // free trial limit
    });

    res.status(201).json({
      success: true,
      message: 'Business created successfully with a 3-day free trial!',
      business,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all businesses associated with the user (owned or team member)
 * @route   GET /api/v1/businesses
 * @access  Private
 */
exports.getBusinesses = async (req, res, next) => {
  try {
    // 1. Get businesses owned by this user
    const ownedBusinesses = await Business.find({ owner: req.user._id });

    // 2. Get businesses where the user is a team member
    const teamMemberships = await TeamMember.find({ user: req.user._id, status: 'Active' }).populate('business');
    const memberBusinesses = teamMemberships
      .filter((tm) => tm.business !== null)
      .map((tm) => {
        // Return business details annotated with team role & permissions
        const b = tm.business.toObject();
        b.teamContext = {
          role: tm.role,
          permissions: tm.permissions,
        };
        return b;
      });

    // Combine them, marking owned ones as owner
    const allBusinesses = [
      ...ownedBusinesses.map((b) => {
        const obj = b.toObject();
        obj.teamContext = {
          role: 'Business Owner',
          permissions: { leads: true, crm: true, invoices: true, quotes: true, analytics: true },
        };
        return obj;
      }),
      ...memberBusinesses,
    ];

    res.status(200).json({
      success: true,
      count: allBusinesses.length,
      businesses: allBusinesses,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get business details
 * @route   GET /api/v1/businesses/:id
 * @access  Private (checked by checkBusinessAccess)
 */
exports.getBusinessDetails = async (req, res, next) => {
  try {
    // req.business is already attached by checkBusinessAccess middleware
    res.status(200).json({
      success: true,
      business: req.business,
      role: req.userRoleInBusiness,
      permissions: req.permissions || { leads: true, crm: true, invoices: true, quotes: true, analytics: true },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update business details (Theme, logo, settings)
 * @route   PUT /api/v1/businesses/:id
 * @access  Private (Only Business Owner or Managers)
 */
exports.updateBusiness = async (req, res, next) => {
  try {
    // Only Business Owner or Manager is allowed to update
    if (req.userRoleInBusiness !== 'Business Owner' && req.userRoleInBusiness !== 'Manager') {
      return res.status(403).json({ success: false, error: 'Only Business Owners or Managers can update settings' });
    }

    const { name, email, phone, street, city, state, country, zip, currency, timezone, themeColor, gstNumber, aiContext } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (themeColor) updateData.themeColor = themeColor;
    if (gstNumber !== undefined) updateData.gstNumber = gstNumber;
    if (currency) updateData.currency = currency;
    if (timezone) updateData.timezone = timezone;
    if (aiContext !== undefined) updateData.aiContext = aiContext;

    // Build address object
    if (street !== undefined || city !== undefined || state !== undefined || country !== undefined || zip !== undefined) {
      updateData.address = {
        street: street !== undefined ? street : req.business.address.street,
        city: city !== undefined ? city : req.business.address.city,
        state: state !== undefined ? state : req.business.address.state,
        country: country !== undefined ? country : req.business.address.country,
        zip: zip !== undefined ? zip : req.business.address.zip,
      };
    }

    // Logo Upload
    if (req.file) {
      updateData.logo = await uploadFile(req.file);
    }

    const updatedBusiness = await Business.findByIdAndUpdate(req.business._id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Business settings updated successfully!',
      business: updatedBusiness,
    });
  } catch (err) {
    next(err);
  }
};
