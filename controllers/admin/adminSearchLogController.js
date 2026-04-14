const db = require('../../config/db');

const getSearchLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, q } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const conditions = [];
    const params     = [];

    if (q) {
      // ✅ Kërko me query, emër, mbiemër dhe email të userit
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
         LEFT JOIN cars c ON c.id = s.car_id    
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
         LEFT JOIN cars c on c.id = s.car_id    
         ${where}
         ORDER BY s.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, Number(limit), offset]
      )
    ]);

    res.json({
      total: countRow[0]?.total || 0,
      page:  Number(page),
      rows
    });

  } catch (err) {
    console.error('❌ getSearchLogs:', err.message);
    res.status(500).json({ message: 'Gabim gjatë leximit.' });
  }
};

const getTopSearches = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT query, COUNT(*) as count, AVG(results) as avg_results
       FROM search_logs
       GROUP BY query
       ORDER BY count DESC
       LIMIT 10`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Gabim.' });
  }
};

module.exports = { getSearchLogs, getTopSearches };