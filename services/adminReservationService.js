const db = require('../config/db');

const AdminReservationsService = {

  getAll: async ({ page = 1, limit = 20, status, search } = {}) => {
    const conditions = [];
    const params     = [];

    if (status) { conditions.push("r.status = ?"); params.push(status); }
    if (search) {
      conditions.push("(c.brand LIKE ? OR c.model LIKE ? OR u.email LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const where  = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (Number(page) - 1) * Number(limit);

    const [countResult, dataResult] = await Promise.all([
      db.query(
        `SELECT COUNT(*) as total
         FROM reservations r
         LEFT JOIN cars c ON c.id = r.car_id
         LEFT JOIN users u ON u.id = r.user_id
         ${where}`, params),
      db.query(
        `SELECT r.*,
                c.brand, c.model, c.year, c.type, c.category,
                u.first_name, u.last_name, u.email
         FROM reservations r
         LEFT JOIN cars c ON c.id = r.car_id
         LEFT JOIN users u ON u.id = r.user_id
         ${where}
         ORDER BY r.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, Number(limit), Number(offset)])
    ]);

    const total = countResult[0][0]?.total || 0;
    const rows  = dataResult[0];

    return { total, page, limit, rows };
  },

  getById: async (id) => {
    const [rows] = await db.query(
      `SELECT r.*,
              c.brand, c.model, c.year, c.type, c.price_per_day,
              u.first_name, u.last_name, u.email
       FROM reservations r
       LEFT JOIN cars c ON c.id = r.car_id
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.id = ?`, [id]
    );
    return rows[0] || null;
  },

  updateStatus: async (id, status) => {
    const validStatuses = ["pending_payment","confirmed","cancelled","completed"];
    if (!validStatuses.includes(status)) {
      throw { code: 400, message: "Status i pavlefshëm" };
    }

    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [res] = await conn.query(
        "SELECT car_id, status FROM reservations WHERE id = ?", [id]
      );
      if (!res[0]) throw { code: 404, message: "Rezervimi nuk u gjet" };

      await conn.query(
        "UPDATE reservations SET status = ? WHERE id = ?", [status, id]
      );

      if (status === "cancelled" || status === "completed") {
        await conn.query(
          "UPDATE cars SET status = 'available' WHERE id = ?", [res[0].car_id]
        );
      }

      await conn.commit();
      return true;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  getMonthlyStats: async () => {
    const [rows] = await db.query(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as total,
        SUM(status='completed') as completed,
        SUM(status='cancelled') as cancelled,
        COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total_price END), 0) as revenue
      FROM reservations
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `);
    return rows;
  },
};

module.exports = AdminReservationsService;