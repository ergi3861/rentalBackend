const CarsModel = require('../models/carModel');
const Media     = require('../uploads/media');

const carController = {

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

  getAllCars: async (req, res) => {
    try {
      const { rows, total } = await CarsModel.getAllCars(req.query);

      const carsWithMedia = await Promise.all(
        rows.map(async (car) => {
          car.media = await Media.getByCarId(car.id);
          return car;
        })
      );

      res.json({ success: true, total, data: carsWithMedia });
    } catch (err) {
      console.error("getAllCars error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

  getFilterOptions: async (req, res) => {
    try {
      const options = await CarsModel.getFilterOptions();
      res.json(options);
    } catch (err) {
      console.error("getFilterOptions error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

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

  getCarById: async (req, res) => {
    try {
      const car = await CarsModel.getById(req.params.id);
      if (!car) return res.status(404).json({ success: false, message: "Makina nuk u gjet" });

      car.media = await Media.getByCarId(req.params.id);
      res.json({ success: true, data: car });
    } catch (err) {
      console.error("getCarById error:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
  },

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