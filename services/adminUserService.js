const db     = require('../config/db');
const bcrypt = require('bcrypt');

const AdminUsersService = {

  getAll: async ({ page = 1, limit = 20, role, search } = {}) => {
    const conditions = [];
    const params     = [];

    if (role) { conditions.push("role = ?"); params.push(role); }
    if (search) {
      conditions.push("(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const where  = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (Number(page) - 1) * Number(limit);

    const [countResult, dataResult] = await Promise.all([
      db.query(`SELECT COUNT(*) as total FROM users ${where}`, params),
      db.query(
        `SELECT u.id, u.first_name, u.last_name, u.email, u.phone, u.role,
                u.city, u.created_at,
                COUNT(r.id) as reservation_count
         FROM users u
         LEFT JOIN reservations r ON r.user_id = u.id
         ${where}
         GROUP BY u.id
         ORDER BY u.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, Number(limit), Number(offset)]
      )
    ]);

    return {
      total: countResult[0][0]?.total || 0,
      page,
      limit,
      rows: dataResult[0],
    };
  },

  getById: async (id) => {
    try {
      const userResult = await db.query(
        `SELECT id, first_name, last_name, email, phone, role,
                city, country, address, age, gender,
                id_number, license_number, license_expiry,
                license_photo, profile_photo,
                created_at
         FROM users WHERE id = ?`,
        [id]
      );

      const user = userResult[0][0];
      if (!user) return null;

      const resResult = await db.query(
        `SELECT r.id, r.status, r.start_datetime, r.end_datetime,
                r.total_price,
                c.brand, c.model, c.year
         FROM reservations r
         JOIN cars c ON c.id = r.car_id
         WHERE r.user_id = ?
         ORDER BY r.created_at DESC LIMIT 20`,
        [id]
      );

      const sellResult = await db.query(
        `SELECT id, brand, model, year, fuel, mileage,
                asking_price, admin_offer_price, status, city, created_at
         FROM car_sell_requests
         WHERE user_id = ?
         ORDER BY created_at DESC LIMIT 10`,
        [id]
      );

      return {
        user,
        reservations: resResult[0]  || [],
        sellRequests: sellResult[0] || [],
      };

    } catch (err) {
      console.error('❌ getById FULL ERROR:', err);
      throw err;
    }
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
    const [result] = await db.query(
      "DELETE FROM users WHERE id = ?", [id]
    );
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