const db        = require('../config/db');
const multer    = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key:    process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'rental/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Vetëm imazhe'), false);
    cb(null, true);
  }
});

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

const uploadLicense = [
  upload.single('license_photo'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'Nuk u ngarkua asnjë imazh.' });

      const fileUrl = req.file.path; 

      await db.query(
        'UPDATE users SET license_photo = ? WHERE id = ?',
        [fileUrl, req.user.id]
      );

      const [user] = await db.query(
        'SELECT phone, date_of_birth, address, city, id_number, license_number, license_photo FROM users WHERE id = ?',
        [req.user.id]
      );
      const profileFields = ['phone','date_of_birth','address','city','id_number','license_number','license_photo'];
      const isComplete = profileFields.every(f => user[0][f]);
      await db.query('UPDATE users SET profile_complete = ? WHERE id = ?', [isComplete ? 1 : 0, req.user.id]);

      res.json({ message: 'Patenta u ngarkua!', license_photo: fileUrl });
    } catch (err) {
      console.error('❌ uploadLicense:', err.message);
      res.status(500).json({ message: 'Gabim gjatë ngarkimit.' });
    }
  }
];

const uploadProfilePhoto = [
  upload.single('profile_photo'),
  async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'Nuk u ngarkua asnjë imazh.' });

      const fileUrl = req.file.path; 
      await db.query('UPDATE users SET profile_photo = ? WHERE id = ?', [fileUrl, req.user.id]);

      res.json({ message: 'Foto u ngarkua!', profile_photo: fileUrl });
    } catch (err) {
      console.error('❌ uploadProfilePhoto:', err.message);
      res.status(500).json({ message: 'Gabim gjatë ngarkimit.' });
    }
  }
];

module.exports = { getProfile, updateProfile, uploadLicense, uploadProfilePhoto };