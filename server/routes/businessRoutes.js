const express = require('express');
const router = express.Router();
const {
  createBusiness,
  getBusinesses,
  getBusinessDetails,
  updateBusiness,
} = require('../controllers/businessController');
const { protect, checkBusinessAccess } = require('../middleware/auth');
const { upload } = require('../utils/cloudinary');

// All routes are protected
router.use(protect);

router.post('/', upload.single('logo'), createBusiness);
router.get('/', getBusinesses);

router.get('/:id', checkBusinessAccess(), getBusinessDetails);
router.put('/:id', checkBusinessAccess(), upload.single('logo'), updateBusiness);

module.exports = router;
