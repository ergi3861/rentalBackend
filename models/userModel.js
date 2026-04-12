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
      SELECT
        r.*,
        c.brand, c.model, c.year, c.category,
        c.price_per_day, c.fuel, c.transmission,
        MIN(m.image_path) AS thumbnail
      FROM reservations r
      JOIN cars c ON c.id = r.car_id
      LEFT JOIN media m ON m.car_id = c.id
      WHERE r.user_id = ?
      GROUP BY r.id
      ORDER BY r.created_at DESC
    `, [userId]);
    return rows;
  },

  // ── Merr moshën e userit ────────────────────────────────────
  getAge: async (userId) => {
    const [rows] = await db.query(
      'SELECT date_of_birth FROM users WHERE id = ?', [userId]
    );
    const dob = rows[0]?.date_of_birth;
    if (!dob) return null;
    return Math.floor((Date.now() - new Date(dob)) / 31557600000);
  },
};

module.exports = User;