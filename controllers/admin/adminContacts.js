const ContactModel = require('../../models/contactModel');

const getContacts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { total, rows } = await ContactModel.findAllPaginated({
      limit: Number(limit),
      offset,
    });

    res.json({ total, rows });
  } catch (err) {
    console.error('❌ Contact error:', err.message);
    res.status(500).json({ message: 'Gabim' });
  }
};

module.exports = { getContacts };