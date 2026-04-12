const db    = require('../config/db');
const Media = require('../models/mediaModel');

const AdminCarsService = {

  getAll: async ({ page = 1, limit = 20, type, status, brand, search } = {}) => {
    const conditions = [];
    const params     = [];

    if (type)   { conditions.push("c.type = ?");   params.push(type);   }
    if (status) { conditions.push("c.status = ?"); params.push(status); }
    if (brand)  { conditions.push("c.brand = ?");  params.push(brand);  }
    if (search) {
      conditions.push(`(
        c.brand        LIKE ? OR
        c.model        LIKE ? OR
        c.vin          LIKE ? OR
        c.category     LIKE ? OR
        c.fuel         LIKE ? OR
        c.color        LIKE ? OR
        c.transmission LIKE ? OR
        c.status       LIKE ? OR
        CAST(c.year AS CHAR) LIKE ?
      )`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`,
                  `%${search}%`, `%${search}%`, `%${search}%`,
                  `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const where  = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (Number(page) - 1) * Number(limit);

    // FIX: mysql2/promise kthen [rows, fields] për çdo query
    // COUNT query: countResult[0] = array i rreshtave, countResult[0][0] = rreshti i parë
    const [countResult, carsResult] = await Promise.all([
      db.query(`SELECT COUNT(*) as total FROM cars c ${where}`, params),
      db.query(
        `SELECT c.*,
                COUNT(r.id) as reservation_count
         FROM cars c
         LEFT JOIN reservations r ON r.car_id = c.id
         ${where}
         GROUP BY c.id
         ORDER BY c.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, Number(limit), Number(offset)]
      )
    ]);

    // countResult[0] = rows array, countResult[0][0] = { total: N }
    const total = countResult[0][0]?.total || 0;
    // carsResult[0] = rows array
    const carRows = carsResult[0];

    // Shto media për çdo makinë
    const carsWithMedia = await Promise.all(
      carRows.map(async (car) => {
        car.media = await Media.getByCarId(car.id);
        return car;
      })
    );

    return {
      total,
      page:  Number(page),
      limit: Number(limit),
      rows:  carsWithMedia
    };
  },

  getById: async (id) => {
    const [rows] = await db.query("SELECT * FROM cars WHERE id = ?", [id]);
    if (!rows[0]) return null;

    const car = rows[0];
    car.media = await Media.getByCarId(id);

    const [reservations] = await db.query(
      `SELECT r.*, u.first_name, u.last_name, u.email
       FROM reservations r
       LEFT JOIN users u ON u.id = r.user_id
       WHERE r.car_id = ?
       ORDER BY r.created_at DESC
       LIMIT 10`,
      [id]
    );
    car.reservations = reservations;
    return car;
  },

  create: async (data, files) => {
    const {
      type, brand, model, vin, category, year,
      fuel, transmission, color, seats,
      price_per_day, sale_price, status
    } = data;

    const [result] = await db.query(
      `INSERT INTO cars
         (type, brand, model, vin, category, year, fuel,
          transmission, color, seats, price_per_day, sale_price, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        type, brand, model, vin,
        category  || "SUV",
        parseInt(year),
        fuel      || "nafte",
        transmission || "manual",
        color     || "black",
        parseInt(seats) || 5,
        price_per_day ? parseFloat(price_per_day) : 0,
        sale_price    ? parseFloat(sale_price)    : 0,
        status    || "available"
      ]
    );

    const carId = result.insertId;
    if (files && files.length > 0) {
      await Media.registerMany(files, carId);
    }
    return carId;
  },

  update: async (id, data) => {
    const fields = [];
    const params = [];

    const allowed = [
      "type", "brand", "model", "vin", "category", "year",
      "fuel", "transmission", "color", "seats",
      "price_per_day", "sale_price", "status"
    ];

    allowed.forEach(f => {
      if (data[f] !== undefined && data[f] !== "") {
        fields.push(`${f} = ?`);
        params.push(data[f]);
      }
    });

    if (fields.length === 0) return false;
    params.push(id);

    const [result] = await db.query(
      `UPDATE cars SET ${fields.join(", ")} WHERE id = ?`,
      params
    );
    return result.affectedRows > 0;
  },

  delete: async (id) => {
    await Media.deleteByCarId(id);
    const [result] = await db.query("DELETE FROM cars WHERE id = ?", [id]);
    return result.affectedRows > 0;
  },

  deleteImage: async (mediaId, carId) => {
    const [result] = await db.query(
      "DELETE FROM media WHERE id = ? AND car_id = ?",
      [mediaId, carId]
    );
    return result.affectedRows > 0;
  },
};

module.exports = AdminCarsService;