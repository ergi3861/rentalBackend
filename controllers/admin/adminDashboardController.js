const DashboardService = require('../../services/adminDashboard');

exports.getStats = async (req, res) => {
  try {
    const stats = await DashboardService.getStats();
    res.json(stats);
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ message: "Gabim gjatë marrjes së statistikave" });
  }
};

exports.getChart = async (req, res) => {
  try {
    const data = await DashboardService.getReservationsChart();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Gabim" });
  }
};

exports.getTopCars = async (req, res) => {
  try {
    const data = await DashboardService.getTopCars();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Gabim" });
  }
};

exports.getRecentActivity = async (req, res) => {
  try {
    const data = await DashboardService.getRecentActivity();
    res.json(data);
  } catch (err) {
    console.error("❌ Activity error:", err.message);
    res.status(500).json({ message: "Gabim" });
  }
};