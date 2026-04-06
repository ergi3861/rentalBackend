const db = require('../config/db');

const ContactModel = {

  async createContact(data) {
    const { emri, mbiemri, email, telefoni, mesazhi } = data;

    const sql = "INSERT INTO contacts (emri, mbiemri, email, telefoni, mesazhi) " +
                "VALUES (?, ?, ?, ?, ?)";

    const [result] = await db.execute(sql, [emri, mbiemri, email, telefoni, mesazhi]);
    return result.insertId;
  },

  async getAllContacts() {
    const [rows] = await db.execute(
      'SELECT * FROM contacts ORDER BY created_at DESC'
    );
    return rows;
  }

};

module.exports = ContactModel;