const express = require("express");
const router  = express.Router();
const bcrypt  = require("bcrypt");
const User    = require("../models/userModel");
const { requireAuth } = require("../middleware/authMiddleware");
const db = require("../config/db");

const {
  getProfile,
  updateProfile,
  uploadLicense,
  uploadProfilePhoto
} = require("../controllers/userController");

router.use(requireAuth);

// ── Validim moshe — middleware i ripërdorshëm ─────────────────
async function checkAge(req, res, next) {
  try {
    const [rows] = await db.query(
      'SELECT date_of_birth FROM users WHERE id = ?', [req.user.id]
    );
    const dob = rows[0]?.date_of_birth;
    if (dob) {
      const age = Math.floor((Date.now() - new Date(dob)) / 31557600000);
      if (age < 20) {
        return res.status(403).json({
          message: 'Duhet të jeni të paktën 20 vjeç për të bërë rezervime ose kërkesa.',
          min_age: 20,
          your_age: age
        });
      }
    }
    next();
  } catch (err) {
    next(); // nëse nuk mund ta kontrollojë, lejo të vazhdojë
  }
}

// ── Profile routes ────────────────────────────────────────────
router.get("/profile",          getProfile);
router.put("/profile",          updateProfile);
router.post("/profile/license", ...uploadLicense);
router.post("/profile/photo",   ...uploadProfilePhoto);

// ── Rezervimet e userit ───────────────────────────────────────
router.get("/reservations", async (req, res) => {
  try {
    const rows = await User.getReservations(req.user.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Gabim gjatë leximit" });
  }
});

// ── Ndrysho fjalëkalimin ──────────────────────────────────────
router.post("/change-password", async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: "Të gjitha fushat kërkohen" });
  if (newPassword.length < 8)
    return res.status(400).json({ message: "Fjalëkalimi duhet të ketë min 8 karaktere" });

  try {
    const rows = await User.findById(req.user.id);
    if (!rows[0]) return res.status(404).json({ message: "Useri nuk u gjet" });

    const valid = bcrypt.compareSync(currentPassword, rows[0].password);
    if (!valid)
      return res.status(401).json({ message: "Fjalëkalimi aktual është i gabuar" });

    const hashed = bcrypt.hashSync(newPassword, 12);
    await db.query("UPDATE users SET password = ? WHERE id = ?", [hashed, req.user.id]);

    res.json({ message: "Fjalëkalimi u ndryshua me sukses" });
  } catch (err) {
    res.status(500).json({ message: "Gabim gjatë ndryshimit" });
  }
});

// ── Eksporto checkAge për routes të tjera ────────────────────
module.exports = router;
module.exports.checkAge = checkAge;