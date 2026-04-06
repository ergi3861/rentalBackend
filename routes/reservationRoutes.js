const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/reservationController');

router.post('/', controller.store);

router.get('/',  controller.index);

module.exports = router;