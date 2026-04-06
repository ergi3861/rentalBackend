const ContactModel = require('../models/contactModel');

const ContactController = {

  async store(req, res) {
    const { emri, mbiemri, email, telefoni, mesazhi } = req.body;

    if (!emri || !mbiemri || !email || !telefoni || !mesazhi) {
      return res.status(400).json({ error: 'Të gjitha fushat janë të detyrueshme.' });
    }

    try {
      const id = await ContactModel.createContact({ emri, mbiemri, email, telefoni, mesazhi });
      console.log(`✅ Kontakt i ri #${id}: ${emri} ${mbiemri} – ${email}`);
      res.status(201).json({ message: 'Mesazhi u dërgua me sukses!' });
    } catch (err) {
      console.error('❌ DB error:', err.message);
      res.status(500).json({ error: 'Gabim i brendshëm. Provoni përsëri.' });
    }
  },

  async index(req, res) {
    try {
      const rows = await ContactModel.getAllContacts();
      res.json(rows);
    } catch (err) {
      console.error('❌ DB error:', err.message);
      res.status(500).json({ error: 'Gabim gjatë leximit.' });
    }
  }

};

module.exports = ContactController;