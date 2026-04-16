const CarSellRequestModel = require('../models/carSellRequestModel');
const db   = require('../config/db');
const fs   = require('fs');
const path = require('path');

const CarSellRequestController = {

  async store(req, res) {
    console.log('📦 Body:', req.body);
    console.log('📷 Files:', req.files?.length || 0);

    const user_id = req.user?.id;
    if (!user_id) {
      return res.status(401).json({ error: 'Duhet të jeni të kyçur për të dërguar një kërkesë.' });
    }

    const {
      brand, model, year, fuel, transmission,
      color, mileage, condition, asking_price,
      name, phone, city,
    } = req.body;

    if (!brand || !model || !year || !mileage || !transmission || !name || !phone || !city) {
      return res.status(400).json({ error: 'Plotëso të gjitha fushat e detyrueshme.' });
    }

    const photoPaths = req.files?.map((f) => f.filename) || [];

    try {
      const id = await CarSellRequestModel.createRequest({
        brand, model,
        year:         parseInt(year),
        fuel,
        transmission,
        color,
        mileage:      parseInt(mileage),
        condition,
        asking_price: asking_price ? parseInt(asking_price) : null,
        name, phone, city,
        user_id,
        photos: photoPaths,
      });

      console.log(`✅ Kërkesë e re #${id}: ${brand} ${model} (${year}) – ${name} / ${phone}`);
      res.status(201).json({ message: 'Kërkesa u dërgua me sukses!', id });

    } catch (err) {
      photoPaths.forEach((filename) => {
        const filePath = path.join('uploads/sell-requests', filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
      console.error('❌ DB error:', err.message);
      res.status(500).json({ error: 'Gabim i brendshëm. Provoni përsëri.' });
    }
  },

  async index(req, res) {
    try {
      const rows = await CarSellRequestModel.getAllRequests();
      res.json(rows);
    } catch (err) {
      console.error('❌ DB error:', err.message);
      res.status(500).json({ error: 'Gabim gjatë leximit.' });
    }
  },

  async show(req, res) {
    try {
      const row = await CarSellRequestModel.getByRequestId(req.params.id);
      if (!row) return res.status(404).json({ error: 'Kërkesa nuk u gjet.' });
      res.json(row);
    } catch (err) {
      res.status(500).json({ error: 'Gabim gjatë leximit.' });
    }
  },

  async getMyRequests(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Kërkohet autentikim.' });
      }
      const [rows] = await db.execute(
        `SELECT * FROM car_sell_requests
         WHERE user_id = ?
         ORDER BY created_at DESC`,
        [userId]
      );
      res.json(rows);
    } catch (err) {
      console.error('❌ getMyRequests:', err.message);
      res.status(500).json({ error: 'Gabim gjatë leximit.' });
    }
  },

  async respondToOffer(req, res) {
    try {
      const userId = req.user?.id;
      const { action } = req.body; 

      if (!['accepted', 'rejected'].includes(action)) {
        return res.status(400).json({ error: 'Aksion i pavlefshëm. Përdor accepted ose rejected.' });
      }

      const [rows] = await db.execute(
        'SELECT * FROM car_sell_requests WHERE id = ? AND user_id = ?',
        [req.params.id, userId]
      );

      if (!rows[0]) {
        return res.status(404).json({ error: 'Kërkesa nuk u gjet.' });
      }
      // Vetëm kërkesat me status 'offered' mund të pranohen/refuzohen
      if (rows[0].status !== 'offered') {
        return res.status(400).json({ error: 'Vetëm kërkesat me ofertë mund të pranohen ose refuzohen.' });
      }

      await db.execute(
        'UPDATE car_sell_requests SET status = ? WHERE id = ?',
        [action, req.params.id]
      );

      res.json({ message: action === 'accepted' ? 'Oferta u pranua!' : 'Oferta u refuzua.' });

    } catch (err) {
      console.error('❌ respondToOffer:', err.message);
      res.status(500).json({ error: 'Gabim gjatë përditësimit.' });
    }
  },

};

module.exports = CarSellRequestController;