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
  },

  async findAllPaginated({ limit, offset }) {
    const [[countRow], [rows]] = await Promise.all([
      db.execute('SELECT COUNT(*) as total FROM contacts'),
      db.execute(
        'SELECT * FROM contacts ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset]
      ),
    ]);

    return { total: countRow[0]?.total || 0, rows };
  }

};

module.exports = ContactModel;