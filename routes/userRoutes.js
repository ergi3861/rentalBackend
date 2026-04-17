const express      = require('express');
const router       = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const checkAge        = require('../middleware/ageMiddleware');
const {
  getProfile,
  updateProfile,
  uploadLicense,
  uploadProfilePhoto,
  getReservations,
  changePassword,
} = require('../controllers/userController');

router.use(requireAuth);

router.get('/profile',          getProfile);
router.put('/profile',          updateProfile);
router.post('/profile/license', ...uploadLicense);
router.post('/profile/photo',   ...uploadProfilePhoto);
router.get('/reservations',     getReservations);
router.post('/change-password', changePassword);

module.exports = router;