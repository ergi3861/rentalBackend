const Reservation = require('../models/reservationModel');
const Deposit = require('../models/depositModel');

exports.create = (data, cb) => {

    const reservationData = {
        user_id: data.user_id,
        car_id: data.car_id,
        start_datetime: data.start_datetime,
        end_datetime: data.end_datetime,
        base_price: data.base_price || 0,
        dynamic_price: data.dynamic_price || 0,
        delivery_fee: data.delivery_fee || 0,
        total_price: data.total_price || 0,
        status: 'pending_payment'
    };

    Reservation.create(reservationData, (err, result) => {

        if (err) return cb({ code: 500 });

        if (data.deposit_amount) {

            Deposit.create({
                reservation_id: result.insertId,
                amount: data.deposit_amount,
                status: 'held'
            }, () => {});

        }

        cb(null, { reservationId: result.insertId });

    });

};

exports.getByUser = (userId, cb) => {
    Reservation.findByUser(userId, cb);
};