const db = require('../config/db');

const CarSellRequestModel = {

  async createRequest(data) {
    const {
      brand, model, year, fuel, transmission,
      color, mileage, condition, asking_price,
      name, phone, city,
      user_id,
      photos = [],
    } = data;

    const sql = `
      INSERT INTO car_sell_requests
        (user_id, brand, model, year, fuel, transmission,
         color, mileage, \`condition\`, asking_price,
         \`name\`, phone, city)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      user_id,          
      brand,
      model,
      year,
      fuel         || null,
      transmission,
      color        || null,
      mileage,
      condition    || null,
      asking_price || null,
      name,
      phone,
      city,
    ];

    const [result] = await db.execute(sql, values);
    const insertId = result.insertId;

    if (photos.length > 0) {
      try {
        const photoSql = `
          INSERT INTO car_sell_request_photos (request_id, filename)
          VALUES ${photos.map(() => '(?, ?)').join(', ')}
        `;
        const photoValues = photos.flatMap((f) => [insertId, f]);
        await db.execute(photoSql, photoValues);
      } catch (_) {
        console.warn('⚠️ Tabela car_sell_request_photos nuk ekziston — foto u anashkaluan.');
      }
    }

    return insertId;
  },

  async getAllRequests() {
    const [rows] = await db.execute(
      'SELECT * FROM car_sell_requests ORDER BY created_at DESC'
    );
    return rows;
  },

  async getByRequestId(id) {
    const [rows] = await db.execute(
      'SELECT * FROM car_sell_requests WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

};

module.exports = CarSellRequestModel;