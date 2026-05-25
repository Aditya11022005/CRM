const express = require('express');
const router = express.Router();
const {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  createPaymentOrder,
  verifyPayment,
  deleteInvoice,
} = require('../controllers/invoiceController');
const { protect, checkBusinessAccess } = require('../middleware/auth');

router.use(protect);

router.get('/', checkBusinessAccess('invoices'), getInvoices);
router.get('/:id', checkBusinessAccess('invoices'), getInvoice);
router.post('/', checkBusinessAccess('invoices'), createInvoice);
router.put('/:id', checkBusinessAccess('invoices'), updateInvoice);
router.post('/:id/payment-order', checkBusinessAccess('invoices'), createPaymentOrder);
router.post('/:id/verify-payment', checkBusinessAccess('invoices'), verifyPayment);
router.delete('/:id', checkBusinessAccess('invoices'), deleteInvoice);

module.exports = router;
