const jwt            = require('jsonwebtoken');
const SearchLogModel = require('../models/searchLogModel');

const logSearch = async (req, res) => {
  try {
    const { query, car_id, car_name, search_type } = req.body;

    if (!query || query.trim().length < 2)
      return res.status(400).json({ message: 'Query shumë e shkurtër.' });

    let userId = null;
    const token = (req.headers.authorization || '').replace('Bearer ', '') || null;
    if (token) {
      try { userId = jwt.verify(token, process.env.JWT_SECRET)?.id || null; } catch (_) {}
    }

    await SearchLogModel.insertLog({ userId, query, car_id, car_name, search_type });
    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('❌ logSearch:', err.message);
    res.status(500).json({ message: 'Gabim gjatë logging.' });
  }
};

module.exports = { logSearch };