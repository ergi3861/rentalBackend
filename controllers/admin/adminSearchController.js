const SearchModel = require('../../models/searchModel');

const adminSearch = async (req, res) => {
  const q = (req.query.q || '').trim();

  if (!q || q.length < 1)
    return res.json({ cars: [], users: [], reservations: [], sellRequests: [], contacts: [] });

  try {
    const { cars, users, reservations, sellRequests, contacts } = await SearchModel.adminSearch(q);
    const total = cars.length + users.length + reservations.length + sellRequests.length + contacts.length;
    res.json({ cars, users, reservations, sellRequests, contacts, total, q });
  } catch (err) {
    console.error('❌ adminSearch:', err.message);
    res.status(500).json({ message: 'Gabim gjatë kërkimit.' });
  }
};

module.exports = { adminSearch };