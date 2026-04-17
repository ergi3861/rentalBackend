const express        = require('express');
const router         = express.Router();
const { publicSearch } = require('../controllers/searchController');
const { logSearch }    = require('../controllers/searchLogController');

router.get('/',     publicSearch);
router.post('/log', logSearch);

module.exports = router;