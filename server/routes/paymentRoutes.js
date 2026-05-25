const express = require('express');
const router = express.Router();
const {
  getSubscription,
  createSubscriptionOrder,
  verifySubscriptionPayment,
} = require('../controllers/paymentController');
const { protect, checkBusinessAccess } = require('../middleware/auth');

router.use(protect);

router.get('/', checkBusinessAccess(), getSubscription);
router.post('/order', checkBusinessAccess(), createSubscriptionOrder);
router.post('/verify', checkBusinessAccess(), verifySubscriptionPayment);

module.exports = router;
