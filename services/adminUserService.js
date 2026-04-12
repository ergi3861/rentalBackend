const db    = require('../config/db');
const bcrypt = require('bcrypt');

const AdminUsersService = {

  getAll: async ({ page = 1, limit = 20, role, search } = {}) => {
    const conditions = [];
    const params     = [];

    if (role)   { conditions.push("role = ?"); params.push(role); }
    if (search) {
      conditions.push("(first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const where  = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (Number(page) - 1) * Number(limit);

    const [countResult, dataResult] = await Promise.all([
      db.query(`SELECT COUNT(*) as total FROM users ${where}`, params),
      db.query(
        `SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.created_at,
                COUNT(r.id) as reservation_count
         FROM users u
         LEFT JOIN reservations r ON r.user_id = u.id
         ${where}
         GROUP BY u.id
         ORDER BY u.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, Number(limit), Number(offset)])
    ]);

    const total = countResult[0][0]?.total || 0;
    const rows  = dataResult[0];

    return { total, page, limit, rows };
  },

  getById: async (id) => {
    const [[user], [reservations], [sellRequests]] = await Promise.all([
      db.query(
        "SELECT id, first_name, last_name, email, role, created_at FROM users WHERE id = ?",
        [id]
      ),
      db.query(
        `SELECT r.*, c.brand, c.model FROM reservations r
         JOIN cars c ON c.id = r.car_id
         WHERE r.user_id = ? ORDER BY r.created_at DESC LIMIT 10`, [id]
      ),
      // FIXED: car_sell_requests nuk ka kolonën 'name' — përdorim user_id
      db.query(
        "SELECT * FROM car_sell_requests WHERE user_id = ? LIMIT 5",
        [id]
      ),
    ]);

    if (!user[0]) return null;
    return { ...user[0], reservations, sellRequests };
  },

  updateRole: async (id, role, requestingAdminRole) => {
    const validRoles = ["user", "admin"];
    if (requestingAdminRole === "superadmin") validRoles.push("superadmin");

    if (!validRoles.includes(role)) {
      throw { code: 400, message: "Rol i pavlefshëm" };
    }

    const [result] = await db.query(
      "UPDATE users SET role = ? WHERE id = ?", [role, id]
    );
    return result.affectedRows > 0;
  },

  delete: async (id) => {
    const [result] = await db.query("DELETE FROM users WHERE id = ?", [id]);
    return result.affectedRows > 0;
  },

  createAdmin: async (data) => {
    const { firstName, lastName, email, password, role } = data;

    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ?", [email]
    );
    if (existing.length > 0) {
      throw { code: 400, message: "Email ekziston tashmë" };
    }

    const hashed = bcrypt.hashSync(password, 12);
    const [result] = await db.query(
      `INSERT INTO users (first_name, last_name, email, password, role)
       VALUES (?, ?, ?, ?, ?)`,
      [firstName, lastName, email.toLowerCase(), hashed, role || "admin"]
    );
    return result.insertId;
  },
};

module.exports = AdminUsersService;