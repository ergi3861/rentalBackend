const CarsModel = require('../models/carModel');
const Media     = require('../uploads/media');
const db        = require('../config/db');

const carController = {

  // ── Krijo makinë me disa imazhe ────────────────────────────
  createCar: async (req, res) => {
    try {
      const {
        type, brand, model, vin, category, year,
        fuel, transmission, color,
        seats, price_per_day, sale_price, status
      } = req.body;

      const result = await CarsModel.create({
        type, brand, model, vin, category, year,
        fuel, transmission, color,
        seats, price_per_day, sale_price, status
      });

      const carId = result.insertId;

      if (req.files && req.files.length > 0) {
        await Media.registerMany(req.files, carId);
      }

      return res.status(201).json({
        msg: `Makina u krijua me ${req.files?.length || 0} imazhe`,
        carId
      });

    } catch (err) {
      console.error("createCar error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // ── Shto imazhe shtesë për një makinë ekzistuese ───────────
  addImages: async (req, res) => {
    try {
      const carId = req.params.id;

      const car = await CarsModel.getById(carId);
      if (!car) return res.status(404).json({ error: "Makina nuk u gjet" });

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "Nuk u ngarkua asnjë imazh" });
      }

      await Media.registerMany(req.files, carId);

      return res.status(201).json({
        msg: `${req.files.length} imazhe u shtuan`,
        carId
      });

    } catch (err) {
      console.error("addImages error:", err);
      res.status(500).json({ error: err.message });
    }
  },

  // ── Filter options ─────────────────────────────────────────
  getFilterOptions: async (req, res) => {
    try {
      const options = await CarsModel.getFilterOptions();
      res.json(options);
    } catch (err) {
      console.error("getFilterOptions error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  // ── Makina me qira ─────────────────────────────────────────
  getRentalCars: async (req, res) => {
    try {
      const { rows } = await CarsModel.getAllCars({ type: "RENTAL" });

      const carsWithMedia = await Promise.all(
        rows.map(async (car) => {
          car.media = await Media.getByCarId(car.id);
          return car;
        })
      );

      res.json(carsWithMedia);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ── Makina për shitje ──────────────────────────────────────
  getSaleCars: async (req, res) => {
    try {
      const { rows } = await CarsModel.getAllCars({ type: "SALE" });

      const carsWithMedia = await Promise.all(
        rows.map(async (car) => {
          car.media = await Media.getByCarId(car.id);
          return car;
        })
      );

      res.json(carsWithMedia);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // ── Merr makinën sipas ID ───────────────────────────────────
  getCarById: async (req, res) => {
    try {
      const [rows] = await db.query(
        'SELECT * FROM cars WHERE id = ?',
        [req.params.id]
      );

      if (!rows[0]) {
        return res.status(404).json({ message: "Makina nuk u gjet" });
      }

      const car = rows[0];

      const [media] = await db.query(
        'SELECT * FROM media WHERE car_id = ? ORDER BY ID ASC',
        [car.id]
      );

      car.media = media;

      res.json(car);

    } catch (err) {
      console.error("getCarById error:", err);
      res.status(500).json({ message: "Server error" });
    }
  },

  // ── Merr të gjitha makinat me filters + pagination ──────────
  getAllCars: async (req, res) => {
    try {
      const {
        search, category, type, status, fuel, transmission,
        sort = "default", page = 1, limit = 24
      } = req.query;

      const offset     = (Number(page) - 1) * Number(limit);
      const conditions = [];
      const params     = [];

      if (search) {
        conditions.push(`(
          c.brand          LIKE ? OR
          c.model          LIKE ? OR
          c.category       LIKE ? OR
          c.fuel           LIKE ? OR
          c.color          LIKE ? OR
          c.transmission   LIKE ? OR
          c.status         LIKE ? OR
          c.vin            LIKE ? OR
          CAST(c.year AS CHAR) LIKE ?
        )`);
        const like = `%${search}%`;
        params.push(like, like, like, like, like, like, like, like, like);
      }

      if (category) { conditions.push('LOWER(c.category) = LOWER(?)'); params.push(category); }
      if (type)         { conditions.push('c.type = ?');         params.push(type);         }
      if (status)       { conditions.push('c.status = ?');       params.push(status);       }
      if (fuel)         { conditions.push('c.fuel = ?');         params.push(fuel);         }
      if (transmission) { conditions.push('c.transmission = ?'); params.push(transmission); }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      // Sort
      let orderBy = 'c.created_at DESC';
      if (sort === 'price_asc')  orderBy = 'COALESCE(c.price_per_day, c.sale_price) ASC';
      if (sort === 'price_desc') orderBy = 'COALESCE(c.price_per_day, c.sale_price) DESC';
      if (sort === 'newest')     orderBy = 'c.created_at DESC';

      const [[countRow], [rows]] = await Promise.all([
        db.query(`SELECT COUNT(*) as total FROM cars c ${where}`, params),
        db.query(
          `SELECT c.*,
             (SELECT JSON_ARRAYAGG(image_path) FROM media
              WHERE car_id = c.id ORDER BY ID ASC) AS media
           FROM cars c
           ${where}
           ORDER BY ${orderBy}
           LIMIT ? OFFSET ?`,
          [...params, Number(limit), offset]
        )
      ]);

      res.json({
        total: countRow[0]?.total || 0,
        page:  Number(page),
        limit: Number(limit),
        data:  rows.map(car => ({
          ...car,
          media: typeof car.media === 'string' ? JSON.parse(car.media) : (car.media || [])
        }))
      });

    } catch (err) {
      console.error("getAllCars error:", err);
      res.status(500).json({ message: "Gabim gjatë marrjes së makinave." });
    }
  },

  // ── Fshi imazhet e makinës ─────────────────────────────────
  deleteImages: async (req, res) => {
    try {
      const carId = req.params.id;
      await Media.deleteByCarId(carId);
      res.json({ msg: "Imazhet u fshinë" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

};

module.exports = carController;