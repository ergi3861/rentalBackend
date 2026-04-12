const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/carSellRequestController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/post',        controller.store);
router.get('/get',          controller.index);
router.get('/my',  requireAuth, controller.getMyRequests);  // ✅ PARA /:id
router.get('/:id',          controller.show);

module.exports = router;