const db = require('../config/db');

const AdminSellRequestsService = {

  getAll: async ({ page = 1, limit = 20, status, search } = {}) => {
    const conditions = [];
    const params     = [];

    if (status) { conditions.push("status = ?"); params.push(status); }
    if (search) {
      conditions.push("(brand LIKE ? OR model LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    const where  = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (Number(page) - 1) * Number(limit);

    const [countResult, dataResult] = await Promise.all([
      db.query(`SELECT COUNT(*) as total FROM car_sell_requests ${where}`, params),
      db.query(
        `SELECT sr.*,
                u.first_name, u.last_name, u.email
         FROM car_sell_requests sr
         LEFT JOIN users u ON u.id = sr.user_id
         ${where}
         ORDER BY sr.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, Number(limit), Number(offset)])
    ]);

    const total = countResult[0][0]?.total || 0;
    const rows  = dataResult[0];

    return { total, page, limit, rows };
  },

  getById: async (id) => {
    const [rows] = await db.query(
      `SELECT sr.*, u.first_name, u.last_name, u.email
       FROM car_sell_requests sr
       LEFT JOIN users u ON u.id = sr.user_id
       WHERE sr.id = ?`, [id]
    );
    return rows[0] || null;
  },

  updateStatus: async (id, status, adminOfferPrice) => {
    const validStatuses = ["submitted","reviewed","rejected","accepted","completed"];
    if (!validStatuses.includes(status)) {
      throw { code: 400, message: "Status i pavlefshëm" };
    }

    const fields = ["status = ?"];
    const params = [status];

    if (adminOfferPrice !== undefined && adminOfferPrice !== null) {
      fields.push("admin_offer_price = ?");
      params.push(adminOfferPrice);
    }

    params.push(id);
    const [result] = await db.query(
      `UPDATE car_sell_requests SET ${fields.join(", ")} WHERE id = ?`, params
    );
    return result.affectedRows > 0;
  },

  delete: async (id) => {
    const [result] = await db.query(
      "DELETE FROM car_sell_requests WHERE id = ?", [id]
    );
    return result.affectedRows > 0;
  },
};

module.exports = AdminSellRequestsService;