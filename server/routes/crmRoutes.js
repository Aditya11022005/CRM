const express = require('express');
const router = express.Router();
const {
  getLeadActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  getPendingReminders,
} = require('../controllers/crmController');
const { protect, checkBusinessAccess } = require('../middleware/auth');

router.use(protect);

router.get('/lead/:leadId', checkBusinessAccess('crm'), getLeadActivities);
router.post('/', checkBusinessAccess('crm'), createActivity);
router.put('/:id', checkBusinessAccess('crm'), updateActivity);
router.delete('/:id', checkBusinessAccess('crm'), deleteActivity);
router.get('/reminders', checkBusinessAccess('crm'), getPendingReminders);

module.exports = router;
