const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/reservationController');
const checkAge = require('../middleware/ageMiddleware');

router.post('/', checkAge, controller.store);

router.get('/',  controller.index);

module.exports = router;