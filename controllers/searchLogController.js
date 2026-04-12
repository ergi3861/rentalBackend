const db = require('../config/db');

const logSearch = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: 'Query shumë e shkurtër.' });
    }

    const userId = req.user?.id || null;

    await db.query(
      `INSERT INTO search_logs (user_id, query, results, created_at)
       VALUES (?, ?, 0, NOW())`,
      [userId, query.trim().toLowerCase()]
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('❌ logSearch:', err.message);
    res.status(500).json({ message: 'Gabim gjatë logging.' });
  }
};

module.exports = { logSearch };