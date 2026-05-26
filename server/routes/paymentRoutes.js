const express = require('express');
const router = express.Router();
const {
  getSubscription,
  createSubscriptionOrder,
  verifySubscriptionPayment,
  validatePromoCode,
  getPublicPackages,
} = require('../controllers/paymentController');
const { protect, checkBusinessAccess } = require('../middleware/auth');

router.get('/packages', getPublicPackages);

router.use(protect);

router.get('/', checkBusinessAccess(), getSubscription);
router.post('/order', checkBusinessAccess(), createSubscriptionOrder);
router.post('/verify', checkBusinessAccess(), verifySubscriptionPayment);
router.post('/validate-promo', checkBusinessAccess(), validatePromoCode);

module.exports = router;
