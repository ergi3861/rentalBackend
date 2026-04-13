const db  = require('../config/db');
const jwt = require('jsonwebtoken');

const logSearch = async (req, res) => {
  try {
    const { query, car_id, car_name, search_type } = req.body;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: 'Query shumë e shkurtër.' });
    }

    // ✅ Merr user_id nga token nëse ekziston (optional auth)
    let userId = null;
    const header = req.headers.authorization || '';
    const token  = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id || null;
      } catch (_) {}
    }

    await db.query(
      `INSERT INTO search_logs (user_id, query, results, car_id, car_name, search_type, created_at)
       VALUES (?, ?, 0, ?, ?, ?, NOW())`,
      [
        userId,
        query.trim().toLowerCase(),
        car_id   || null,
        car_name || null,
        search_type || 'typing',
      ]
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('❌ logSearch:', err.message);
    res.status(500).json({ message: 'Gabim gjatë logging.' });
  }
};

module.exports = { logSearch };