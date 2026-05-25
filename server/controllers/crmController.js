const CRMActivity = require('../models/CRMActivity');
const Lead = require('../models/Lead');

/**
 * @desc    Get activity logs and notes for a lead
 * @route   GET /api/v1/crm/lead/:leadId
 * @access  Private (checked by checkBusinessAccess)
 */
exports.getLeadActivities = async (req, res, next) => {
  try {
    const activities = await CRMActivity.find({
      business: req.business._id,
      lead: req.params.leadId,
    })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create CRM activity (Note, Call, WhatsApp, Email, Reminder, Status Change)
 * @route   POST /api/v1/crm
 * @access  Private
 */
exports.createActivity = async (req, res, next) => {
  try {
    const { leadId, type, description, reminderDate } = req.body;

    if (!leadId || !description) {
      return res.status(400).json({ success: false, error: 'Lead ID and description are required' });
    }

    const lead = await Lead.findOne({ _id: leadId, business: req.business._id });
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found in this workspace' });
    }

    const activity = await CRMActivity.create({
      business: req.business._id,
      lead: leadId,
      user: req.user._id,
      type: type || 'Note',
      description,
      reminderDate: reminderDate ? new Date(reminderDate) : null,
      isCompleted: false,
    });

    // If type is Status Change and matches a valid Lead status, update lead status
    if (type === 'Status Change') {
      const matchStatus = ['New', 'Contacted', 'Interested', 'Follow-up', 'Converted', 'Closed'];
      // check if status is described or extracted
      const words = description.split(' ');
      const newStatus = words.find((w) => matchStatus.includes(w));
      if (newStatus) {
        lead.status = newStatus;
        await lead.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Activity logged successfully!',
      activity,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update activity (toggle reminder completed state)
 * @route   PUT /api/v1/crm/:id
 * @access  Private
 */
exports.updateActivity = async (req, res, next) => {
  try {
    const { isCompleted, description, reminderDate } = req.body;

    let activity = await CRMActivity.findOne({ _id: req.params.id, business: req.business._id });
    if (!activity) {
      return res.status(404).json({ success: false, error: 'CRM activity not found' });
    }

    if (isCompleted !== undefined) activity.isCompleted = isCompleted;
    if (description) activity.description = description;
    if (reminderDate !== undefined) activity.reminderDate = reminderDate ? new Date(reminderDate) : null;

    await activity.save();

    res.status(200).json({
      success: true,
      message: 'Activity updated successfully!',
      activity,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete CRM activity log
 * @route   DELETE /api/v1/crm/:id
 * @access  Private
 */
exports.deleteActivity = async (req, res, next) => {
  try {
    const activity = await CRMActivity.findOneAndDelete({ _id: req.params.id, business: req.business._id });

    if (!activity) {
      return res.status(404).json({ success: false, error: 'CRM activity not found' });
    }

    res.status(200).json({ success: true, message: 'Activity log deleted' });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get pending follow-up reminders for dashboard
 * @route   GET /api/v1/crm/reminders
 * @access  Private
 */
exports.getPendingReminders = async (req, res, next) => {
  try {
    const reminders = await CRMActivity.find({
      business: req.business._id,
      type: 'Reminder',
      isCompleted: false,
    })
      .populate('lead', 'name phone email status')
      .sort({ reminderDate: 1 });

    res.status(200).json({
      success: true,
      count: reminders.length,
      reminders,
    });
  } catch (err) {
    next(err);
  }
};
