const db = require('../config/db');

const DashboardService = {

  getStats: async () => {
    const [[cars], [users], [reservations], [sellRequests], [contacts], [revenue]] =
      await Promise.all([
        db.query(`SELECT
          COUNT(*) as total,
          SUM(type='RENTAL') as rental,
          SUM(type='SALE') as sale,
          SUM(status='available') as available,
          SUM(status='reserved') as reserved,
          SUM(status='sold') as sold
          FROM cars`),

        db.query(`SELECT
          COUNT(*) as total,
          SUM(role='user') as users,
          SUM(role='admin') as admins,
          SUM(DATE(created_at) = CURDATE()) as today
          FROM users`),

        // ✅ FIX 1: statuset reale nga DB tënde
        db.query(`SELECT
          COUNT(*) as total,
          SUM(status='pending_payment') as pending,
          SUM(status='confirmed') as confirmed,
          SUM(status='completed') as completed,
          SUM(status='cancelled') as cancelled,
          SUM(DATE(created_at) = CURDATE()) as today
          FROM reservations`),

        // ✅ FIX 2: statuset reale të car_sell_requests
        db.query(`SELECT
          COUNT(*) as total,
          SUM(status='submitted') as new_requests,
          SUM(status='reviewed') as approved,
          SUM(status='rejected') as rejected
          FROM car_sell_requests`),

        db.query(`SELECT COUNT(*) as total FROM contacts`),

        // ✅ FIX 3: statusi i saktë
        db.query(`SELECT
          COALESCE(SUM(total_price), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN MONTH(created_at)=MONTH(NOW()) AND YEAR(created_at)=YEAR(NOW())
            THEN total_price END), 0) as monthly_revenue
          FROM reservations WHERE status != 'cancelled'`),
      ]);

    return {
      cars:         cars[0],
      users:        users[0],
      reservations: reservations[0],
      sellRequests: sellRequests[0],
      contacts:     contacts[0],
      revenue:      revenue[0],
    };
  },

  getReservationsChart: async () => {
    const [rows] = await db.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count,
        COALESCE(SUM(total_price), 0) as revenue
      FROM reservations
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);
    return rows;
  },

  getTopCars: async () => {
    const [rows] = await db.query(`
      SELECT c.brand, c.model, c.year, c.type,
             COUNT(r.id) as reservation_count,
             COALESCE(SUM(r.total_price), 0) as total_revenue
      FROM cars c
      LEFT JOIN reservations r ON r.car_id = c.id
      GROUP BY c.id
      ORDER BY reservation_count DESC
      LIMIT 5
    `);
    return rows;
  },

  getRecentActivity: async () => {
    const [[reservations], [sellRequests], [contacts]] = await Promise.all([
      db.query(`
        SELECT 'reservation' as type, r.id, r.status, r.created_at,
               c.brand, c.model,
               NULL as name, NULL as email
        FROM reservations r
        JOIN cars c ON c.id = r.car_id
        ORDER BY r.created_at DESC LIMIT 5
      `),
      // ✅ FIX 4: car_sell_requests nuk ka kolonën 'name' — ka brand/model/status
      db.query(`
        SELECT 'sell_request' as type, sr.id, sr.status, sr.created_at,
               sr.brand, sr.model,
               NULL as name, NULL as email
        FROM car_sell_requests sr
        ORDER BY sr.created_at DESC LIMIT 5
      `),
      db.query(`
        SELECT 'contact' as type, c.id, 'new' as status, c.created_at,
               NULL as brand, NULL as model,
               CONCAT(COALESCE(c.emri,''), ' ', COALESCE(c.mbiemri,'')) as name,
               c.email
        FROM contacts c
        ORDER BY c.created_at DESC LIMIT 5
      `),
    ]);

    const all = [...reservations, ...sellRequests, ...contacts];
    all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return all.slice(0, 10);
  },
};

module.exports = DashboardService;