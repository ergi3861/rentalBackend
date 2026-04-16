const db = require('../../config/db');

const AdminSellController = {

  async getAll(req, res) {
    try {
      const { page = 1, limit = 15, status } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const conditions = [];
      const params     = [];

      if (status) {
        conditions.push("s.status = ?");
        params.push(status);
      }

      const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

      const [[countRow], [rows]] = await Promise.all([
        db.query(
          `SELECT COUNT(*) as total FROM car_sell_requests s ${where}`,
          params
        ),
        db.query(
          `SELECT s.*
           FROM car_sell_requests s
           ${where}
           ORDER BY s.created_at DESC
           LIMIT ? OFFSET ?`,
          [...params, Number(limit), offset]
        )
      ]);

      const total = countRow[0]?.total || 0;

      const rowsWithMedia = await Promise.all(
        rows.map(async (row) => {
          const [media] = await db.query(
            "SELECT * FROM media WHERE car_id = ? ORDER BY ID ASC",
            [row.id]
          );
          return { ...row, media };
        })
      );

      res.json({ total, page: Number(page), limit: Number(limit), rows: rowsWithMedia });
    } catch (err) {
      console.error("❌ getAll sell-requests:", err.message);
      res.status(500).json({ message: "Gabim gjatë leximit." });
    }
  },

  async getById(req, res) {
    try {
      const [rows] = await db.query(
        "SELECT * FROM car_sell_requests WHERE id = ?",
        [req.params.id]
      );
      if (!rows[0]) return res.status(404).json({ message: "Kërkesa nuk u gjet." });

      const [media] = await db.query(
        "SELECT * FROM media WHERE car_id = ? ORDER BY ID ASC",
        [req.params.id]
      );

      res.json({ ...rows[0], media });
    } catch (err) {
      res.status(500).json({ message: "Gabim gjatë leximit." });
    }
  },

  async updateStatus(req, res) {
    try {
      const { status, admin_offer_price } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Statusi kërkohet." });
      }

      const fields = ["status = ?"];
      const params = [status];

      if (admin_offer_price !== undefined) {
        fields.push("admin_offer_price = ?");
        params.push(parseFloat(admin_offer_price));
      }

      params.push(req.params.id);

      const [result] = await db.query(
        `UPDATE car_sell_requests SET ${fields.join(", ")} WHERE id = ?`,
        params
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Kërkesa nuk u gjet." });
      }

      res.json({ message: "Statusi u përditësua." });
    } catch (err) {
      console.error("❌ updateStatus sell-request:", err.message);
      res.status(500).json({ message: "Gabim gjatë përditësimit." });
    }
  },

  async delete(req, res) {
    try {
      await db.query("DELETE FROM media WHERE car_id = ?", [req.params.id]);

      const [result] = await db.query(
        "DELETE FROM car_sell_requests WHERE id = ?",
        [req.params.id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Kërkesa nuk u gjet." });
      }

      res.json({ message: "Kërkesa u fshi." });
    } catch (err) {
      console.error("❌ delete sell-request:", err.message);
      res.status(500).json({ message: "Gabim gjatë fshirjes." });
    }
  }
};

module.exports = AdminSellController;