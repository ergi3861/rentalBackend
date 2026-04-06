const db = require('../config/db')
console.log('🔍 db type:', typeof db);
console.log('🔍 db.execute:', typeof db.execute);   ;

const CarSellRequestModel = {
async createRequest(data) {
  const {
    brand, model, year, fuel, transmission,
    color, mileage, condition, asking_price,
    name, phone, city
  } = data;

  const sql = "INSERT INTO car_sell_requests " +
    "(brand, model, year, fuel, transmission, color, mileage, `condition`, asking_price, `name`, phone, city) " +
    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

  const values = [
    brand, model, year,
    fuel         || null,
    transmission,
    color        || null,
    mileage,
    condition    || null,
    asking_price || null,
    name, phone, city
  ];

  console.log('🔍 SQL:', sql);
  console.log('🔍 values:', values);

  const [result] = await db.execute(sql, values);
  return result.insertId;
},
async getAllRequests() {
  const [rows] = await db.execute(
    'SELECT * FROM car_sell_requests ORDER BY created_at DESC'
  );
  return rows;
}
,
async  getByRequestId(id) {
  const [rows] = await db.execute(
    'SELECT * FROM car_sell_requests WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}
}
module.exports = CarSellRequestModel;