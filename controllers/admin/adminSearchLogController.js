const SearchLogModel = require('../../models/searchLogModel');

const getSearchLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, q } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const { total, rows } = await SearchLogModel.findAllPaginated({ limit: Number(limit), offset, q });
    res.json({ total, page: Number(page), rows });
  } catch (err) {
    console.error('❌ getSearchLogs:', err.message);
    res.status(500).json({ message: 'Gabim gjatë leximit.' });
  }
};

const getTopSearches = async (req, res) => {
  try {
    const rows = await SearchLogModel.getTopSearches();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Gabim.' });
  }
};

module.exports = { getSearchLogs, getTopSearches };