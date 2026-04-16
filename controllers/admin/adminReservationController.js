const AdminReservationsService = require('../../services/adminReservationService');
const AuditLog                 = require('../../models/auditLog');

exports.getAll = async (req, res) => {
  try {
    const data = await AdminReservationsService.getAll(req.query);
    res.json(data);
  } catch (err) {
        console.error("❌ Reservation error:", err.message);

    res.status(500).json({ message: "Gabim gjatë marrjes së rezervimeve" });
  }
};

exports.getById = async (req, res) => {
  try {
    const r = await AdminReservationsService.getById(req.params.id);
    if (!r) return res.status(404).json({ message: "Rezervimi nuk u gjet" });
    res.json(r);
  } catch (err) {
    res.status(500).json({ message: "Gabim" });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await AdminReservationsService.updateStatus(req.params.id, status, req.admin.id);
    await AuditLog.log({
      adminId:    req.admin.id,
      action:     'reservation_status_changed',
      targetType: 'reservation',
      targetId:   req.params.id,
      details:    { status },
    });
    res.json({ message: 'Statusi u ndryshua' });
  } catch (err) {
    res.status(err.code || 500).json({ message: err.message || "Gabim" });
  }
};

exports.getMonthlyStats = async (req, res) => {
  try {
    const data = await AdminReservationsService.getMonthlyStats();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Gabim" });
  }
};