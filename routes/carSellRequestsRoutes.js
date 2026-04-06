const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/carSellRequestController');
 
router.post('/post',    controller.store);
 
router.get('/get',     controller.index);
 
router.get('/:id',  controller.show);
 
module.exports = router;
 