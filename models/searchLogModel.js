const db = require('../config/db');

const SearchLogModel = {

  async insertLog({ userId, query, results, car_id, car_name, search_type }) {
    await db.query(
      `INSERT INTO search_logs (user_id, query, results, car_id, car_name, search_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [userId, query.trim().toLowerCase(), results ?? 0, car_id || null, car_name || null, search_type || 'typing']
    );
  },

  async insertSimpleLog({ userId, query, results }) {
    await db.query(
      'INSERT INTO search_logs (user_id, query, results) VALUES (?, ?, ?)',
      [userId || null, query, results]
    );
  },

  async findAllPaginated({ limit, offset, q }) {
    const conditions = [];
    const params     = [];

    if (q) {
      conditions.push(`(
        s.query      LIKE ? OR
        u.first_name LIKE ? OR
        u.last_name  LIKE ? OR
        u.email      LIKE ? OR
        CONCAT(u.first_name, ' ', u.last_name) LIKE ? OR
        c.brand      LIKE ? OR
        c.model      LIKE ?
      )`);
      const like = `%${q}%`;
      params.push(like, like, like, like, like, like, like);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [[countRow], [rows]] = await Promise.all([
      db.query(
        `SELECT COUNT(*) as total
         FROM search_logs s
         LEFT JOIN users u ON u.id = s.user_id
         LEFT JOIN cars  c ON c.id = s.car_id
         ${where}`,
        params
      ),
      db.query(
        `SELECT
           s.id, s.query, s.results, s.created_at,
           s.car_id, s.car_name, s.search_type,
           u.first_name, u.last_name, u.email
         FROM search_logs s
         LEFT JOIN users u ON u.id = s.user_id
         LEFT JOIN cars  c ON c.id = s.car_id
         ${where}
         ORDER BY s.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, Number(limit), offset]
      )
    ]);

    return { total: countRow[0]?.total || 0, rows };
  },

  async getTopSearches() {
    const [rows] = await db.query(
      `SELECT query, COUNT(*) as count, AVG(results) as avg_results
       FROM search_logs
       GROUP BY query
       ORDER BY count DESC
       LIMIT 10`
    );
    return rows;
  }

};

module.exports = SearchLogModel;