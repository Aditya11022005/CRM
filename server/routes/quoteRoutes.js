const express = require('express');
const router = express.Router();
const {
  getQuotes,
  getQuote,
  createQuote,
  updateQuote,
  deleteQuote,
} = require('../controllers/quoteController');
const { protect, checkBusinessAccess } = require('../middleware/auth');
const { upload } = require('../utils/cloudinary');

router.use(protect);

router.get('/', checkBusinessAccess('quotes'), getQuotes);
router.get('/:id', checkBusinessAccess('quotes'), getQuote);
router.post('/', checkBusinessAccess('quotes'), createQuote);
router.put('/:id', checkBusinessAccess('quotes'), upload.single('signature'), updateQuote);
router.delete('/:id', checkBusinessAccess('quotes'), deleteQuote);

module.exports = router;
