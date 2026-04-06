const db = require('../config/db');

const User = {

  create: async (data) => {
    const [result] = await db.query(
      `INSERT INTO users (first_name, last_name, email, password, role)
       VALUES (?, ?, ?, ?, ?)`,
      [data.first_name, data.last_name, data.email, data.password, data.role || "user"]
    );
    return result;
  },

  findByEmail: async (email) => {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ?', [email]
    );
    return rows;
  },

  findById: async (id) => {
    const [rows] = await db.query(
      'SELECT id, first_name, last_name, email, password, role, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows;
  },

  getReservations: async (userId) => {
    const [rows] = await db.query(`
      SELECT r.*, c.brand, c.model, c.year, c.category,
             c.price_per_day, c.fuel, c.transmission
      FROM reservations r
      JOIN cars c ON c.id = r.car_id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC
    `, [userId]);
    return rows;
  },
};

module.exports = User;