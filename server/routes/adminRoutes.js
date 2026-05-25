const express = require('express');
const router = express.Router();
const {
  getPlatformStats,
  getUsers,
  toggleBlockUser,
  getBusinesses,
  toggleApproveBusiness,
  getPayments,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// Lock all routes behind Super Admin authentication
router.use(protect);
router.use(authorize('Super Admin'));

router.get('/stats', getPlatformStats);
router.get('/users', getUsers);
router.patch('/users/:id/block', toggleBlockUser);
router.get('/businesses', getBusinesses);
router.patch('/businesses/:id/approve', toggleApproveBusiness);
router.get('/payments', getPayments);

module.exports = router;
