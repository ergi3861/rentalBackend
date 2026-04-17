const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/contactController');

router.post('/post', controller.store);

router.get('/get',   controller.index);

module.exports = router;