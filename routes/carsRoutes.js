const express    = require('express');
const router     = express.Router();
const controller = require('../controllers/carController');
const Media      = require('../uploads/media');

// upload.array("images", 10) — prano field-in "images", max 10 foto
const uploadMany = Media.upload.array("images", 10);

// GET  /api/cars/filters
router.get('/filters',       controller.getFilterOptions);

// GET  /api/cars
router.get('/',              controller.getAllCars);

// GET  /api/cars/:id
router.get('/:id',           controller.getCarById);

// POST /api/cars  — krijo makinë me disa imazhe
router.post('/',   uploadMany, controller.createCar);

// POST /api/cars/:id/images  — shto imazhe shtesë
router.post('/:id/images', uploadMany, controller.addImages);

// DELETE /api/cars/:id/images  — fshi të gjitha imazhet
router.delete('/:id/images', controller.deleteImages);

module.exports = router;