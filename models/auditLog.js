const db = require('../config/db');

// ✅ Tabela audit_logs ka: id, admin_id, action, entity, entity_id, created_at
// NUK ka: target_type, target_id, details

const AuditLog = {

  log: async ({ adminId, action, targetType, targetId }) => {
    try {
      await db.query(
        `INSERT INTO audit_logs (admin_id, action, entity, entity_id, created_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [adminId, action, targetType || 'unknown', targetId || 0]
      );
    } catch (err) {
      // Mos prishe flow-n kryesor nëse log dështon
      console.error("AuditLog error:", err.message);
    }
  },

  getAll: async ({ page = 1, limit = 50, adminId, action } = {}) => {
    const conditions = [];
    const params     = [];

    if (adminId) { conditions.push("al.admin_id = ?"); params.push(adminId); }
    if (action)  { conditions.push("al.action = ?");   params.push(action);  }

    const where  = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (page - 1) * limit;

    const [[{ total }], rows] = await Promise.all([
      db.query(`SELECT COUNT(*) as total FROM audit_logs al ${where}`, params),
      db.query(
        `SELECT al.*, u.first_name, u.last_name, u.email
         FROM audit_logs al
         LEFT JOIN users u ON u.id = al.admin_id
         ${where}
         ORDER BY al.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, Number(limit), offset]
      )
    ]);

    return { total: total[0]?.total || 0, rows: rows[0] };
  },
};

module.exports = AuditLog;