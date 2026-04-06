const db = require('../config/db');


const Media = {

  getByCarId: async (carId) => {
    const [rows] = await db.query(
      "SELECT * FROM media WHERE car_id = ? ORDER BY ID ASC", [carId]
    );
    return rows;
  },

  registerMany: async (files, carId) => {
    if (!files || files.length === 0) return;
    const values = files.map(f => [f.filename, carId]);
    await db.query("INSERT INTO media (image_path, car_id) VALUES ?", [values]);
  },

  deleteById: async (id) => {
    const [result] = await db.query("DELETE FROM media WHERE ID = ?", [id]);
    return result.affectedRows > 0;
  },

  deleteByCarId: async (carId) => {
    await db.query("DELETE FROM media WHERE car_id = ?", [carId]);
  },
};

module.exports = Media;