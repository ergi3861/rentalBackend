const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const path       = require('path');
const controller = require('../controllers/carSellRequestController');
const { requireAuth } = require('../middleware/authMiddleware');

// ── Multer config ─────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/sell-requests/');
  },
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext     = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime    = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Vetëm imazhe lejohen.'));
  },
});

// ── Routes ────────────────────────────────────────────────────
// ✅ upload.array('photos', 10) lexon FormData dhe foto
router.post('/post', upload.array('photos', 10), controller.store);
router.get('/get',   controller.index);
router.get('/my',    requireAuth, controller.getMyRequests);
router.get('/:id',   controller.show);

module.exports = router;