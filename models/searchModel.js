const db = require('../config/db');

const SearchModel = {

  async publicSearch(q) {
    const like = `%${q}%`;

    const [cars] = await db.query(
      `SELECT id, brand, model, year, type, status,
              fuel, transmission, category,
              price_per_day, sale_price, color,
              NULL AS thumbnail
       FROM cars
       WHERE brand        LIKE ?
          OR model        LIKE ?
          OR category     LIKE ?
          OR fuel         LIKE ?
          OR color        LIKE ?
          OR transmission LIKE ?
          OR status       LIKE ?
          OR vin          LIKE ?
          OR CAST(year AS CHAR) LIKE ?
       ORDER BY brand ASC
       LIMIT 8`,
      [like, like, like, like, like, like, like, like, like]
    );

    const carsWithThumbs = await Promise.all(
      cars.map(async (car) => {
        try {
          const [media] = await db.query(
            'SELECT image_path FROM media WHERE car_id = ? ORDER BY id ASC LIMIT 1',
            [car.id]
          );
          return { ...car, thumbnail: media[0]?.image_path || null };
        } catch {
          return { ...car, thumbnail: null };
        }
      })
    );

    return carsWithThumbs;
  },

  async adminSearch(q) {
    const like = `%${q}%`;

    const [[cars], [users], [reservations], [sellRequests], [contacts]] =
      await Promise.all([
        db.query(
          `SELECT id, brand, model, year, vin, status, type, price_per_day, sale_price
           FROM cars
           WHERE brand LIKE ? OR model LIKE ? OR vin LIKE ?
           LIMIT 5`,
          [like, like, like]
        ),
        db.query(
          `SELECT id, first_name, last_name, email, role
           FROM users
           WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ?
           LIMIT 5`,
          [like, like, like]
        ),
        db.query(
          `SELECT r.id, r.status, r.start_datetime, r.end_datetime, r.total_price,
                  COALESCE(u.first_name, 'Guest') AS first_name,
                  COALESCE(u.last_name,  '')       AS last_name,
                  c.brand, c.model
           FROM reservations r
           LEFT JOIN users u ON u.id = r.user_id AND r.user_id != 0
           LEFT JOIN cars  c ON c.id = r.car_id
           WHERE c.brand LIKE ? OR c.model LIKE ?
              OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?
           ORDER BY r.created_at DESC
           LIMIT 5`,
          [like, like, like, like, like]
        ),
        db.query(
          `SELECT id, name, phone, city, brand, model, year, status, asking_price
           FROM car_sell_requests
           WHERE name LIKE ? OR phone LIKE ? OR brand LIKE ? OR model LIKE ?
           LIMIT 5`,
          [like, like, like, like]
        ),
        db.query(
          `SELECT id, emri, mbiemri, email, telefoni, created_at,
                  SUBSTRING(mesazhi, 1, 80) AS message_preview
           FROM contacts
           WHERE emri LIKE ? OR mbiemri LIKE ? OR email LIKE ? OR telefoni LIKE ? OR mesazhi LIKE ?
           LIMIT 5`,
          [like, like, like, like, like]
        ),
      ]);

    return { cars, users, reservations, sellRequests, contacts };
  },

  async findCars(filters) {
    // ... kodi ekzistues nga më lart
  }

};

module.exports = SearchModel;