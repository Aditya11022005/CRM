const express = require('express');
const router = express.Router();
const {
  getLeads,
  getLead,
  createLead,
  updateLead,
  toggleFavorite,
  deleteLead,
  runPlacesSearch,
  runMapsScraper,
  stopMapsScraper,
  getScraperStatus,
  enrichSingleLead,
  generateLeadPitch,
  bulkEnrichLeads,
  importLeads,
  bulkDeleteLeads,
  bulkUpdateStatus,
} = require('../controllers/leadController');
const { protect, checkBusinessAccess } = require('../middleware/auth');

router.use(protect);

router.get('/', checkBusinessAccess('leads'), getLeads);

// Named static routes MUST come before /:id wildcard
router.get('/scrape-status', checkBusinessAccess('leads'), getScraperStatus);

// CRUD
router.get('/:id', checkBusinessAccess('leads'), getLead);
router.post('/', checkBusinessAccess('leads'), createLead);
router.put('/:id', checkBusinessAccess('leads'), updateLead);
router.patch('/:id/favorite', checkBusinessAccess('leads'), toggleFavorite);
router.delete('/:id', checkBusinessAccess('leads'), deleteLead);

// GMaps lead generation actions
router.post('/search-places', checkBusinessAccess('leads'), runPlacesSearch);
router.post('/scrape-maps', checkBusinessAccess('leads'), runMapsScraper);
router.post('/scrape-stop', checkBusinessAccess('leads'), stopMapsScraper);

// AI Actions
router.post('/bulk-enrich', checkBusinessAccess('leads'), bulkEnrichLeads);
router.post('/import', checkBusinessAccess('leads'), importLeads);
router.post('/bulk-delete', checkBusinessAccess('leads'), bulkDeleteLeads);
router.post('/bulk-status', checkBusinessAccess('leads'), bulkUpdateStatus);
router.post('/:id/ai-enrich', checkBusinessAccess('leads'), enrichSingleLead);
router.get('/:id/ai-pitch', checkBusinessAccess('leads'), generateLeadPitch);

module.exports = router;
