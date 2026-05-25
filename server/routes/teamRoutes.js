const express = require('express');
const router = express.Router();
const {
  getTeamMembers,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
} = require('../controllers/teamController');
const { protect, checkBusinessAccess } = require('../middleware/auth');

router.use(protect);

router.get('/', checkBusinessAccess(), getTeamMembers);
router.post('/', checkBusinessAccess(), addTeamMember);
router.put('/:id', checkBusinessAccess(), updateTeamMember);
router.delete('/:id', checkBusinessAccess(), removeTeamMember);

module.exports = router;
