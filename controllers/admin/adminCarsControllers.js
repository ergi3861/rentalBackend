const AdminCarsService = require('../../services/adminCarService');
const AuditLog         = require('../../models/auditLog');
const Media            = require('../../models/mediaModel');
const multer           = require('multer');
const path             = require('path');

// ── Multer ────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename:    (req, file, cb) =>
    cb(null, Date.now() + '-' + Math.random().toString(36).slice(2) + path.extname(file.originalname)),
});

exports.upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Vetëm imazhe'));
    cb(null, true);
  }
}).array('images', 10);

// ── getAll ────────────────────────────────────────────────────
exports.getAll = async (req, res) => {
  try {
    const data = await AdminCarsService.getAll(req.query);
    res.json(data);
  } catch (err) {
    console.error('❌ getAll cars:', err.message);
    res.status(500).json({ message: "Gabim gjatë marrjes së makinave" });
  }
};

// ── getById ───────────────────────────────────────────────────
exports.getById = async (req, res) => {
  try {
    const car = await AdminCarsService.getById(req.params.id);
    if (!car) return res.status(404).json({ message: "Makina nuk u gjet" });
    res.json(car);
  } catch (err) {
    console.error('❌ getById car:', err.message);
    res.status(500).json({ message: "Gabim" });
  }
};

// ── create ────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const carId = await AdminCarsService.create(req.body, req.files);

    // FIX: req.admin.id (nga requireAdmin middleware) — jo req.admin.id
    await AuditLog.log({
      adminId:    req.admin.id,
      action:     'car_created',
      targetType: 'car',
      targetId:   carId,
      details:    { brand: req.body.brand, model: req.body.model },
    });

    res.status(201).json({ message: 'Makina u shtua', carId });
  } catch (err) {
    console.error('❌ create car:', err.message);
    res.status(500).json({ message: err.message || "Gabim gjatë krijimit" });
  }
};

// ── update ────────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const ok = await AdminCarsService.update(req.params.id, req.body);
    if (!ok) return res.status(404).json({ message: "Makina nuk u gjet" });

    // FIX: req.admin.id
    await AuditLog.log({
      adminId:    req.admin.id,
      action:     'car_updated',
      targetType: 'car',
      targetId:   req.params.id,
      details:    req.body,
    });

    res.json({ message: 'Makina u përditësua' });
  } catch (err) {
    console.error('❌ update car:', err.message);
    res.status(500).json({ message: "Gabim gjatë përditësimit" });
  }
};

// ── delete ────────────────────────────────────────────────────
exports.delete = async (req, res) => {
  try {
    const ok = await AdminCarsService.delete(req.params.id);
    if (!ok) return res.status(404).json({ message: "Makina nuk u gjet" });

    // FIX: req.admin.id
    await AuditLog.log({
      adminId:    req.admin.id,
      action:     'car_deleted',
      targetType: 'car',
      targetId:   req.params.id,
    });

    res.json({ message: 'Makina u fshi' });
  } catch (err) {
    console.error('❌ delete car:', err.message);
    res.status(500).json({ message: "Gabim gjatë fshirjes" });
  }
};

// ── addImages ─────────────────────────────────────────────────
exports.addImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "Nuk u ngarkua asnjë imazh" });
    }
    await Media.registerMany(req.files, req.params.id);
    res.json({ message: `${req.files.length} imazhe u shtuan` });
  } catch (err) {
    console.error('❌ addImages:', err.message);
    res.status(500).json({ message: "Gabim gjatë ngarkimit" });
  }
};

// ── deleteImage ───────────────────────────────────────────────
exports.deleteImage = async (req, res) => {
  try {
    const ok = await AdminCarsService.deleteImage(req.params.mediaId, req.params.id);
    if (!ok) return res.status(404).json({ message: "Imazhi nuk u gjet" });
    res.json({ message: 'Imazhi u fshi' });
  } catch (err) {
    console.error('❌ deleteImage:', err.message);
    res.status(500).json({ message: "Gabim" });
  }
};