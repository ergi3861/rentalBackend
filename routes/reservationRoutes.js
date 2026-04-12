const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/reservationController');

// POST /api/reservations
router.post('/', controller.store);

// GET  /api/reservations
router.get('/',  controller.index);

module.exports = router;