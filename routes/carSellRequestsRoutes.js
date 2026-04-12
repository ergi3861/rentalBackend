const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/carSellRequestController');
 
// POST   /api/sell-requests      → dërgo kërkesë të re
router.post('/post',    controller.store);
 
// GET    /api/sell-requests      → merr të gjitha (për test)
router.get('/get',     controller.index);
 
// GET    /api/sell-requests/:id  → merr një kërkesë
router.get('/:id',  controller.show);
 
module.exports = router;
 