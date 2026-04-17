  const db = require('../config/db');

  const OFFICE_LOCATION = "Tirana Center";
  const DELIVERY_FEE    = 15; 

  const ReservationModel = {

    async create(data) {
      const {
        car_id,
        pickup_location,
        dropoff_location,
        start_datetime,
        end_datetime,
        price_per_day,
      } = data;

      const start   = new Date(start_datetime);
      const end     = new Date(end_datetime);
      const diffMs  = end - start;
      const days    = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      const base_price    = parseFloat((price_per_day * days).toFixed(2));
      const delivery_fee  = (
        pickup_location  !== OFFICE_LOCATION ||
        dropoff_location !== OFFICE_LOCATION
      ) ? DELIVERY_FEE : 0;
      const total_price   = parseFloat((base_price + delivery_fee).toFixed(2));

      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        const [cars] = await conn.query(
          'SELECT status FROM cars WHERE id = ? FOR UPDATE',
          [car_id]
        );

        if (!cars[0])                        throw new Error('Makina nuk u gjet.');
        if (cars[0].status !== 'available')  throw new Error('Makina nuk është e disponueshme.');

        const [result] = await conn.query(
          `INSERT INTO reservations
            (user_id, car_id, start_datetime, end_datetime,
              base_price, dynamic_price, delivery_fee, total_price, status)
          VALUES (0, ?, ?, ?, ?, 10, ?, ?, 'pending_payment')`,
          [car_id, start_datetime, end_datetime, base_price, delivery_fee, total_price]
        );

        await conn.query(
          'UPDATE cars SET status = ? WHERE id = ?',
          ['reserved', car_id]
        );

        await conn.commit();

        return {
          id: result.insertId,
          days,
          base_price,
          delivery_fee,
          total_price,
        };

      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    },

    async getAll() {
      const [rows] = await db.query(
        `SELECT r.*, c.brand, c.model, c.year, c.price_per_day
        FROM reservations r
        JOIN cars c ON c.id = r.car_id
        ORDER BY r.created_at DESC`
      );
      return rows;
    },

    async getById(id) {
      const [rows] = await db.query(
        'SELECT * FROM reservations WHERE id = ?', [id]
      );
      return rows[0] || null;
    }

  };

  module.exports = ReservationModel;