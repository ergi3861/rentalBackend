const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/carController');
const Media      = require('../uploads/media');

const uploadMany = Media.upload.array("images", 10);

router.get('/filters',       controller.getFilterOptions);

router.get('/',              controller.getAllCars);

router.get('/:id',           controller.getCarById);

router.post('/',   uploadMany, controller.createCar);

router.post('/:id/images', uploadMany, controller.addImages);

router.delete('/:id/images', controller.deleteImages);

module.exports = router;