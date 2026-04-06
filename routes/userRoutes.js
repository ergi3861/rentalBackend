const express = require("express");
const router  = express.Router();
const bcrypt  = require("bcrypt");
const User    = require("../models/userModel");
const { requireAuth } = require("../middleware/authMiddleware");

router.use(requireAuth);

router.get("/reservations", async (req, res) => {
  try {
    const rows = await User.getReservations(req.user.id);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Gabim gjatë leximit" });
  }
});

router.post("/change-password", async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "Të gjitha fushat kërkohen" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: "Min 8 karaktere" });
  }

  try {
    const rows = await User.findById(req.user.id);
    if (!rows[0]) return res.status(404).json({ message: "Useri nuk u gjet" });

    const valid = bcrypt.compareSync(currentPassword, rows[0].password);
    if (!valid) return res.status(401).json({ message: "Fjalëkalimi aktual është i gabuar" });

    const hashed = bcrypt.hashSync(newPassword, 12);
    const db = require("../config/db");
    await db.query("UPDATE users SET password = ? WHERE id = ?", [hashed, req.user.id]);

    res.json({ message: "Fjalëkalimi u ndryshua me sukses" });
  } catch (err) {
    res.status(500).json({ message: "Gabim gjatë ndryshimit" });
  }
});

module.exports = router;