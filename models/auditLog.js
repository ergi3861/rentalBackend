const db = require('../config/db');

const AuditLog = {

  
  log: async ({ adminId, action, entity, entityId, oldValue, newValue, ipAddress, userAgent }) => {
    try {
      await db.query(
        `INSERT INTO audit_logs
           (admin_id, action, entity, entity_id, old_value, new_value, ip_address, user_agent, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          adminId,
          action,
          entity       ?? 'unknown',
          entityId     ?? 0,
          oldValue     ? JSON.stringify(oldValue)  : null,
          newValue     ? JSON.stringify(newValue)  : null,
          ipAddress    ?? null,
          userAgent    ?? null,
        ]
      );
    } catch (err) {
      
      console.error('[AuditLog] Insert error:', err.message);
    }
  },

  getAll: async ({ page = 1, limit = 50, adminId, action, entity, entityId, from, to } = {}) => {
    const conditions = [];
    const params     = [];

    if (adminId)  { conditions.push('al.admin_id  = ?');  params.push(adminId);  }
    if (action)   { conditions.push('al.action    = ?');  params.push(action);   }
    if (entity)   { conditions.push('al.entity    = ?');  params.push(entity);   }
    if (entityId) { conditions.push('al.entity_id = ?');  params.push(entityId); }
    if (from)     { conditions.push('al.created_at >= ?'); params.push(from);    }
    if (to)       { conditions.push('al.created_at <= ?'); params.push(to);      }

    const where  = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (page - 1) * limit;

    const [[countRows], [rows]] = await Promise.all([
      db.query(`SELECT COUNT(*) AS total FROM audit_logs al ${where}`, params),
      db.query(
        `SELECT
           al.id,
           al.action,
           al.entity,
           al.entity_id,
           al.old_value,
           al.new_value,
           al.ip_address,
           al.user_agent,
           al.created_at,
           u.first_name,
           u.last_name,
           u.email
         FROM audit_logs al
         LEFT JOIN users u ON u.id = al.admin_id
         ${where}
         ORDER BY al.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, Number(limit), offset]
      ),
    ]);

    return {
      total: countRows[0]?.total ?? 0,
      rows:  rows.map(AuditLog._parse),
    };
  },

  getById: async (id) => {
    const [rows] = await db.query(
      `SELECT al.*, u.first_name, u.last_name, u.email
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.admin_id
       WHERE al.id = ?
       LIMIT 1`,
      [id]
    );
    if (!rows[0]) return null;
    const log = AuditLog._parse(rows[0]);
    log.diff  = AuditLog._diff(log.oldValue, log.newValue);
    return log;
  },

  getByEntity: async (entity, entityId) => {
    const [rows] = await db.query(
      `SELECT al.*, u.first_name, u.last_name, u.email
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.admin_id
       WHERE al.entity = ? AND al.entity_id = ?
       ORDER BY al.created_at DESC`,
      [entity, entityId]
    );
    return rows.map(r => {
      const log = AuditLog._parse(r);
      log.diff  = AuditLog._diff(log.oldValue, log.newValue);
      return log;
    });
  },

  purge: async (days = 90) => {
    const [result] = await db.query(
      `DELETE FROM audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days]
    );
    return result.affectedRows;
  },

  _parse: (row) => ({
    ...row,
    oldValue:  row.old_value ? JSON.parse(row.old_value) : null,
    newValue:  row.new_value ? JSON.parse(row.new_value) : null,
    old_value: undefined,
    new_value: undefined,
  }),

  _diff: (oldVal, newVal) => {
    if (!oldVal || !newVal) return null;
    const diff = {};
    const keys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);
    for (const key of keys) {
      const o = oldVal[key] ?? null;
      const n = newVal[key] ?? null;
      if (JSON.stringify(o) !== JSON.stringify(n)) {
        diff[key] = { from: o, to: n };
      }
    }
    return Object.keys(diff).length ? diff : null;
  },
};

module.exports = AuditLog;