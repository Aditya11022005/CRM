const TeamMember = require('../models/TeamMember');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

/**
 * @desc    Get all team members for a business
 * @route   GET /api/v1/team
 * @access  Private (checked by checkBusinessAccess)
 */
exports.getTeamMembers = async (req, res, next) => {
  try {
    const members = await TeamMember.find({ business: req.business._id })
      .populate('user', 'name email status role')
      .populate('invitedBy', 'name');

    res.status(200).json({
      success: true,
      count: members.length,
      team: members,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Add / Invite team member to a business
 * @route   POST /api/v1/team
 * @access  Private (Owner only)
 */
exports.addTeamMember = async (req, res, next) => {
  try {
    // Only business owner can manage team
    if (req.userRoleInBusiness !== 'Business Owner') {
      return res.status(403).json({ success: false, error: 'Only the Business Owner can add team members' });
    }

    const { email, name, role, permissions } = req.body;

    if (!email || !name) {
      return res.status(400).json({ success: false, error: 'Name and Email are required' });
    }

    // 1. Check if user already exists
    let user = await User.findOne({ email });
    let isNewUser = false;
    let tempPassword = '';

    if (!user) {
      // Auto-create user with a temporary password
      isNewUser = true;
      tempPassword = Math.random().toString(36).substring(2, 10); // 8 char temp password
      user = await User.create({
        name,
        email,
        password: tempPassword,
        role: 'Employee', // User-level role
        isVerified: true,  // pre-verify so they can login directly
      });
    }

    // 2. Check if already a member of this business
    const existingMember = await TeamMember.findOne({ business: req.business._id, user: user._id });
    if (existingMember) {
      return res.status(400).json({ success: false, error: 'User is already a team member of this business' });
    }

    // 3. Create Team Member record
    const teamMember = await TeamMember.create({
      business: req.business._id,
      user: user._id,
      role: role || 'Employee',
      permissions: permissions || {
        leads: true,
        crm: true,
        invoices: false,
        quotes: false,
        analytics: true,
      },
      invitedBy: req.user._id,
    });

    // 4. Send email notification
    let emailMessage = `You have been added to the business team "${req.business.name}" on Codeitz CRM.\n\n`;
    if (isNewUser) {
      emailMessage += `An account has been created for you. Log in with these credentials:\nEmail: ${email}\nPassword: ${tempPassword}\n\nPlease change your password after logging in.`;
    } else {
      emailMessage += `You can switch to "${req.business.name}" from your Codeitz workspace selector.`;
    }

    try {
      await sendEmail({
        email: email,
        subject: `Codeitz CRM - Added to Team ${req.business.name}`,
        message: emailMessage,
        html: `
          <div style="font-family: sans-serif; padding: 20px;">
            <h3 style="color: #4f46e5;">Added to ${req.business.name} Team</h3>
            <p>Hello ${name},</p>
            <p>You have been added as a <b>${role || 'Employee'}</b> in <b>${req.business.name}</b> on Codeitz CRM.</p>
            ${
              isNewUser
                ? `<div style="background: #f3f4f6; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 15px 0;">
                     <p style="margin: 0 0 5px 0;"><b>Your Account Access:</b></p>
                     <p style="margin: 0 0 5px 0;">URL: <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}">${process.env.FRONTEND_URL || 'http://localhost:5173'}</a></p>
                     <p style="margin: 0 0 5px 0;">Email: <b>${email}</b></p>
                     <p style="margin: 0;">Temporary Password: <b>${tempPassword}</b></p>
                   </div>
                   <p style="color: #6b7280; font-size: 13px;">Please change your password immediately after logging in.</p>`
                : `<p>Login to your account and switch workspaces to view the workspace.</p>`
            }
          </div>
        `,
      });
    } catch (e) {
      console.error('Failed to send team invitation email:', e.message);
    }

    res.status(201).json({
      success: true,
      message: 'Team member added successfully!',
      teamMember,
      devTempPassword: tempPassword, // for testing convenience
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update team member permissions
 * @route   PUT /api/v1/team/:id
 * @access  Private (Owner only)
 */
exports.updateTeamMember = async (req, res, next) => {
  try {
    if (req.userRoleInBusiness !== 'Business Owner') {
      return res.status(403).json({ success: false, error: 'Only the Business Owner can modify team permissions' });
    }

    const { role, permissions } = req.body;

    const teamMember = await TeamMember.findOne({ _id: req.params.id, business: req.business._id });
    if (!teamMember) {
      return res.status(404).json({ success: false, error: 'Team member not found in this business' });
    }

    if (role) teamMember.role = role;
    if (permissions) teamMember.permissions = { ...teamMember.permissions, ...permissions };

    await teamMember.save();

    res.status(200).json({
      success: true,
      message: 'Team permissions updated successfully!',
      teamMember,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Remove team member
 * @route   DELETE /api/v1/team/:id
 * @access  Private (Owner only)
 */
exports.removeTeamMember = async (req, res, next) => {
  try {
    if (req.userRoleInBusiness !== 'Business Owner') {
      return res.status(403).json({ success: false, error: 'Only the Business Owner can remove team members' });
    }

    const teamMember = await TeamMember.findOneAndDelete({ _id: req.params.id, business: req.business._id });
    if (!teamMember) {
      return res.status(404).json({ success: false, error: 'Team member not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Team member removed from business.',
    });
  } catch (err) {
    next(err);
  }
};
