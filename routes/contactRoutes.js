const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/contactController');

// POST  /api/contacts/post  → ruaj mesazhin
router.post('/post', controller.store);

// GET   /api/contacts/get   → shiko të gjitha (për test)
router.get('/get',   controller.index);

module.exports = router;