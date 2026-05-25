const express = require('express');
const router = express.Router();
const { getDashboardData } = require('../controllers/dashboardController');
const { protect, checkBusinessAccess } = require('../middleware/auth');

router.use(protect);

router.get('/', checkBusinessAccess('analytics'), getDashboardData);

module.exports = router;
