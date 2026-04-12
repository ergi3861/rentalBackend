const db     = require('../config/db');
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// ── Multer për foto ───────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/profiles';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `user-${req.user.id}-${Date.now()}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Vetëm imazhe'), false);
    cb(null, true);
  }
});

// ── GET /api/user/profile ─────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, first_name, last_name, email, phone,
              date_of_birth, age, gender, address, city, country,
              id_number, license_number, license_photo, license_expiry,
              profile_photo, profile_complete, role, created_at, updated_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    if (!rows[0]) return res.status(404).json({ message: 'Useri nuk u gjet.' });

    // Llogarit % të plotësimit
    const user = rows[0];
    const fields = ['phone','date_of_birth','address','city','id_number','license_number','license_photo'];
    const filled  = fields.filter(f => user[f]).length;
    const percent = Math.round((filled / fields.length) * 100);

    res.json({ ...user, completion_percent: percent });
  } catch (err) {
    console.error('❌ getProfile:', err.message);
    res.status(500).json({ message: 'Gabim gjatë leximit.' });
  }
};

// ── PUT /api/user/profile ─────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const allowed = [
      'phone', 'date_of_birth', 'age', 'gender',
      'address', 'city', 'country',
      'id_number', 'license_number', 'license_expiry'
    ];

    const fields = [];
    const params = [];

    allowed.forEach(f => {
      if (req.body[f] !== undefined) {
        fields.push(`${f} = ?`);
        params.push(req.body[f] || null);
      }
    });

    if (fields.length === 0) return res.status(400).json({ message: 'Nuk ka të dhëna për të përditësuar.' });

    // Kontrollo nëse profili është i plotë
    const checkFields = ['phone','date_of_birth','address','city','id_number','license_number'];
    const allFilled = checkFields.every(f =>
      req.body[f] || (req.body[f] === undefined)
    );

    // Merr të dhënat ekzistuese për të kontrolluar plotësinë
    const [existing] = await db.query(
      'SELECT phone, date_of_birth, address, city, id_number, license_number, license_photo FROM users WHERE id = ?',
      [req.user.id]
    );

    const merged = { ...existing[0], ...req.body };
    const profileFields = ['phone','date_of_birth','address','city','id_number','license_number'];
    const isComplete = profileFields.every(f => merged[f]) && merged.license_photo;

    fields.push('profile_complete = ?');
    params.push(isComplete ? 1 : 0);

    params.push(req.user.id);

    await db.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);

    // Kthen profilin e ri
    const [updated] = await db.query(
      `SELECT id, first_name, last_name, email, phone,
              date_of_birth, age, gender, address, city, country,
              id_number, license_number, license_photo, license_expiry,
              profile_photo, profile_complete, role, created_at, updated_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    res.json({ message: 'Profili u përditësua me sukses!', user: updated[0] });
  } catch (err) {
    console.error('❌ updateProfile:', err.message);
    res.status(500).json({ message: 'Gabim gjatë përditësimit.' });
  }
};

// ── POST /api/user/profile/license ───────────────────────────
const uploadLicense = [
  upload.single('license_photo'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'Nuk u ngarkua asnjë imazh.' });

      const filename = `profiles/${req.file.filename}`;

      await db.query(
        'UPDATE users SET license_photo = ? WHERE id = ?',
        [filename, req.user.id]
      );

      // Ri-kontrollo plotësinë
      const [user] = await db.query(
        'SELECT phone, date_of_birth, address, city, id_number, license_number, license_photo FROM users WHERE id = ?',
        [req.user.id]
      );
      const profileFields = ['phone','date_of_birth','address','city','id_number','license_number','license_photo'];
      const isComplete = profileFields.every(f => user[0][f]);
      await db.query('UPDATE users SET profile_complete = ? WHERE id = ?', [isComplete ? 1 : 0, req.user.id]);

      res.json({ message: 'Patenta u ngarkua!', license_photo: filename });
    } catch (err) {
      console.error('❌ uploadLicense:', err.message);
      res.status(500).json({ message: 'Gabim gjatë ngarkimit.' });
    }
  }
];

// ── POST /api/user/profile/photo ──────────────────────────────
const uploadProfilePhoto = [
  upload.single('profile_photo'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'Nuk u ngarkua asnjë imazh.' });

      const filename = `profiles/${req.file.filename}`;
      await db.query('UPDATE users SET profile_photo = ? WHERE id = ?', [filename, req.user.id]);

      res.json({ message: 'Foto u ngarkua!', profile_photo: filename });
    } catch (err) {
      console.error('❌ uploadProfilePhoto:', err.message);
      res.status(500).json({ message: 'Gabim gjatë ngarkimit.' });
    }
  }
];

module.exports = { getProfile, updateProfile, uploadLicense, uploadProfilePhoto };