const db = require('../config/db');

const publicSearch = async (req, res) => {
  const q = (req.query.q || '').trim();

  console.log('🔍 SEARCH HIT — query:', q);

  if (!q || q.length < 2) {
    return res.json({ cars: [], total: 0, q });
  }

  const like = `%${q}%`;

  try {
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

    console.log('✅ SEARCH RESULT:', cars.length, 'cars for query:', q);
    if (cars.length > 0) console.log('   First result:', cars[0].brand, cars[0].model);

    const carsWithThumbs = await Promise.all(
      cars.map(async (car) => {
        try {
          const [media] = await db.query(
            'SELECT image_path FROM media WHERE car_id = ? ORDER BY ID ASC LIMIT 1',
            [car.id]
          );
          return { ...car, thumbnail: media[0]?.image_path || null };
        } catch {
          return { ...car, thumbnail: null };
        }
      })
    );

    db.query(
      'INSERT INTO search_logs (user_id, query, results) VALUES (?, ?, ?)',
      [req.user?.id || null, q, cars.length]
    ).catch(() => {});

    return res.json({ cars: carsWithThumbs, total: carsWithThumbs.length, q });

  } catch (err) {
    console.error('❌ SEARCH ERROR:', err.message);
    console.error('   Stack:', err.stack);
    return res.status(500).json({ message: 'Gabim gjatë kërkimit.', error: err.message });
  }
};

module.exports = { publicSearch };