const ReservationModel = require('../models/reservationModel');
const db = require('../config/db');

const ReservationController = {

  async store(req, res) {
    const {
      car_id,
      pickupLocation, pickupDate, pickupTime,
      dropLocation,   dropDate,   dropTime,
      price_per_day,
    } = req.body;

    if (!car_id || !pickupLocation || !pickupDate || !pickupTime ||
        !dropLocation || !dropDate || !dropTime) {
      return res.status(400).json({ error: 'Të gjitha fushat janë të detyrueshme.' });
    }

    const start_datetime = `${pickupDate} ${pickupTime}:00`;
    const end_datetime   = `${dropDate} ${dropTime}:00`;

    if (new Date(end_datetime) <= new Date(start_datetime)) {
      return res.status(400).json({ error: 'Data e kthimit duhet të jetë pas datës së marrjes.' });
    }

    const user_id = req.user?.id || null;

    try {
      const result = await ReservationModel.create({
        car_id,
        user_id,
        pickup_location:  pickupLocation,
        dropoff_location: dropLocation,
        start_datetime,
        end_datetime,
        price_per_day: parseFloat(price_per_day) || 0,
      });

      console.log(`✅ Rezervim #${result.id} — Makina #${car_id} — ${result.days} ditë — Total: ${result.total_price}€`);

      res.status(201).json({
        message:      'Rezervimi u krye me sukses!',
        id:           result.id,
        days:         result.days,
        base_price:   result.base_price,
        delivery_fee: result.delivery_fee,
        total_price:  result.total_price,
      });

    } catch (err) {
      console.error('❌ Reservation error:', err.message);
      if (err.message.includes('disponueshme') || err.message.includes('gjet')) {
        return res.status(409).json({ error: err.message });
      }
      res.status(500).json({ error: 'Gabim i brendshëm. Provoni përsëri.' });
    }
  },

  async index(req, res) {
    try {
      const rows = await ReservationModel.getAll();
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async myReservations(req, res) {
    try {
      const [rows] = await db.query(
        `SELECT r.*, c.brand, c.model, c.year, c.category, c.price_per_day
         FROM reservations r
         JOIN cars c ON c.id = r.car_id
         WHERE r.user_id = ?
         ORDER BY r.created_at DESC`,
        [req.user.id]
      );
      res.json(rows);
    } catch (err) {
      console.error('❌ myReservations error:', err.message);
      res.status(500).json({ error: 'Gabim gjatë leximit.' });
    }
  }

};

module.exports = ReservationController;