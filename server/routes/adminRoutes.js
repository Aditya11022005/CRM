const express = require('express');
const router = express.Router();
const {
  getPlatformStats,
  getUsers,
  toggleBlockUser,
  getBusinesses,
  toggleApproveBusiness,
  getPayments,
  
  // Package Management
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,

  // Offer Management
  getOffers,
  createOffer,
  updateOffer,
  deleteOffer,

  // Announcement Broadcasts
  getAnnouncements,
  createAnnouncement,
  toggleAnnouncementActive,
  deleteAnnouncement,
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

// SaaS Pricing Packages CRUD
router.get('/packages', getPackages);
router.post('/packages', createPackage);
router.put('/packages/:id', updatePackage);
router.delete('/packages/:id', deletePackage);

// SaaS Discount Coupons CRUD
router.get('/offers', getOffers);
router.post('/offers', createOffer);
router.put('/offers/:id', updateOffer);
router.delete('/offers/:id', deleteOffer);

// System Announcements CRUD
router.get('/announcements', getAnnouncements);
router.post('/announcements', createAnnouncement);
router.patch('/announcements/:id/toggle', toggleAnnouncementActive);
router.delete('/announcements/:id', deleteAnnouncement);

module.exports = router;
